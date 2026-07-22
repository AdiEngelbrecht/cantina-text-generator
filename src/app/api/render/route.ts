import {randomUUID} from 'crypto';
import {mkdir} from 'fs/promises';
import path from 'path';
import {NextResponse} from 'next/server';
import type {ConversationProps} from '../../../lib/types';
import {getBundleDir, getJobs} from './jobs';

export const runtime = 'nodejs';
export const maxDuration = 300;

const isValidProps = (body: unknown): body is ConversationProps => {
  if (typeof body !== 'object' || body === null) return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.contactName === 'string' &&
    Array.isArray(p.messages) &&
    typeof p.sound === 'string' &&
    (p.theme === 'dark' || p.theme === 'light')
  );
};

/**
 * The cached bundle serves files from `public/` as they existed at bundle
 * time, so uploaded videos added later would 404 through the bundle. Rewrite
 * site-relative video srcs to absolute URLs on the request origin (the dev /
 * prod Next server) so the headless browser fetches them from there instead.
 * Sounds stay as staticFile paths inside the composition and are fine.
 */
const absolutizeVideoSrcs = (
  props: ConversationProps,
  origin: string,
): ConversationProps => ({
  ...props,
  messages: props.messages.map((m) =>
    m.kind === 'video' && m.src.startsWith('/')
      ? {...m, src: `${origin}${m.src}`}
      : m,
  ),
});

const RENDER_DIR = path.join('/tmp', 'renders');

const runRender = async (
  id: string,
  props: ConversationProps,
): Promise<void> => {
  const jobs = getJobs();
  const job = jobs.get(id);
  if (!job) return;

  try {
    const serveUrl = await getBundleDir();
    // webpackIgnore: load via Node at runtime (see jobs.ts).
    const {selectComposition, renderMedia} = await import(
      /* webpackIgnore: true */ '@remotion/renderer'
    );

    const composition = await selectComposition({
      serveUrl,
      id: 'ConversationVideo',
      inputProps: props,
    });

    const outDir = RENDER_DIR;
    await mkdir(outDir, {recursive: true});
    const outPath = path.join(outDir, `${id}.mp4`);

    await renderMedia({
      composition,
      serveUrl,
      codec: 'h264',
      outputLocation: outPath,
      inputProps: props,
      onProgress: ({progress}) => {
        job.progress = progress;
      },
    });

    job.status = 'done';
    job.progress = 1;
    job.url = `/api/download/${id}`;
  } catch (err) {
    job.status = 'error';
    job.error = err instanceof Error ? err.message : String(err);
  }
};

export const POST = async (req: Request) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: 'Expected JSON body'}, {status: 400});
  }
  if (!isValidProps(body)) {
    return NextResponse.json(
      {error: 'Invalid ConversationProps (need contactName, messages, sound, theme)'},
      {status: 400},
    );
  }

  const id = randomUUID();
  const origin = new URL(req.url).origin;
  const props = absolutizeVideoSrcs(body, origin);

  getJobs().set(id, {status: 'rendering', progress: 0});
  // Kick off async — do NOT await; client polls GET /api/render/[id].
  void runRender(id, props);

  return NextResponse.json({id});
};
