import {createReadStream, statSync} from 'fs';
import path from 'path';
import {NextResponse} from 'next/server';

export const runtime = 'nodejs';

const UPLOAD_DIR = path.join('/tmp', 'uploads');

export const GET = async (
  _req: Request,
  {params}: {params: Promise<{name: string}>},
) => {
  const {name} = await params;
  // Reject path traversal
  if (name.includes('..') || name.includes('/')) {
    return NextResponse.json({error: 'Invalid filename'}, {status: 400});
  }

  const filePath = path.join(UPLOAD_DIR, name);
  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      return NextResponse.json({error: 'Not found'}, {status: 404});
    }
  } catch {
    return NextResponse.json({error: 'Not found'}, {status: 404});
  }

  const fileStream = createReadStream(filePath);
  return new Response(fileStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'video/mp4',
      'Cache-Control': 'no-store',
    },
  });
};
