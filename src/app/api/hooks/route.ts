import {readdir} from 'fs/promises';
import path from 'path';
import {NextResponse} from 'next/server';

export const runtime = 'nodejs';

const VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm']);

/**
 * Lists the predisposed hook clips clippers dropped into `public/hooks/`.
 * Returns `{hooks: [{name, src}]}` — `name` is the filename without extension,
 * `src` the public URL path. Empty array when the folder is missing or has
 * no video files (README.txt and dotfiles are skipped).
 */
export const GET = async () => {
  const dir = path.join(process.cwd(), 'public', 'hooks');
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    entries = [];
  }

  const hooks = entries
    .filter((file) => {
      if (file.startsWith('.')) return false;
      return VIDEO_EXTS.has(path.extname(file).toLowerCase());
    })
    .sort()
    .map((file) => ({
      name: file.slice(0, file.length - path.extname(file).length),
      src: `/hooks/${file}`,
    }));

  return NextResponse.json({hooks});
};
