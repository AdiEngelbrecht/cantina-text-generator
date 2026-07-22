import {randomUUID} from 'crypto';
import {mkdir, writeFile} from 'fs/promises';
import path from 'path';
import {NextResponse} from 'next/server';

export const runtime = 'nodejs';
// Allow large uploads / long uploads.
export const maxDuration = 300;

const MAX_BYTES = 200 * 1024 * 1024; // 200MB

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};
const ALLOWED_EXTS = new Set(['mp4', 'mov', 'webm']);

export const POST = async (req: Request) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({error: 'Expected multipart form data'}, {status: 400});
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({error: "Missing 'file' field"}, {status: 400});
  }
  if (file.size === 0) {
    return NextResponse.json({error: 'Empty file'}, {status: 400});
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({error: 'File exceeds 200MB limit'}, {status: 413});
  }

  const extFromName = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase()
    : '';
  const ext = ALLOWED_EXTS.has(extFromName)
    ? extFromName
    : EXT_BY_MIME[file.type];
  if (!ext) {
    return NextResponse.json(
      {error: 'Unsupported file type (mp4/mov/webm only)'},
      {status: 415},
    );
  }

  const name = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, {recursive: true});
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({src: `/uploads/${name}`});
};
