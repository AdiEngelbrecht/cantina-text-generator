import {createReadStream, statSync, unlinkSync} from 'fs';
import path from 'path';
import {NextResponse} from 'next/server';
import {getJobs} from '../../render/jobs';

export const runtime = 'nodejs';

const RENDER_DIR = path.join('/tmp', 'renders');

export const GET = async (
  _req: Request,
  {params}: {params: Promise<{id: string}>},
) => {
  const {id} = await params;
  // Reject path traversal
  if (id.includes('..') || id.includes('/')) {
    return NextResponse.json({error: 'Invalid id'}, {status: 400});
  }

  const job = getJobs().get(id);
  if (!job || job.status !== 'done') {
    return NextResponse.json({error: 'Render not ready'}, {status: 404});
  }

  const filePath = path.join(RENDER_DIR, `${id}.mp4`);
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({error: 'File not found'}, {status: 404});
    }
  } catch {
    return NextResponse.json({error: 'File not found'}, {status: 404});
  }

  const fileStream = createReadStream(filePath);

  // Delete the file after streaming starts (fire-and-forget cleanup).
  fileStream.on('open', () => {
    try {
      unlinkSync(filePath);
    } catch {
      // ignore cleanup errors
    }
  });

  return new Response(fileStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="cantina-text-${id.slice(0, 8)}.mp4"`,
      'Cache-Control': 'no-store',
    },
  });
};
