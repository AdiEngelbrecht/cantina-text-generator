import {NextResponse} from 'next/server';
import {getJobs} from '../jobs';

export const runtime = 'nodejs';

export const GET = async (
  _req: Request,
  {params}: {params: Promise<{id: string}>},
) => {
  const {id} = await params;
  const job = getJobs().get(id);
  if (!job) {
    return NextResponse.json({error: 'Unknown render job'}, {status: 404});
  }

  const body: Record<string, unknown> = {
    status: job.status,
    progress: job.progress,
  };
  if (job.url) body.url = job.url;
  if (job.error) body.error = job.error;
  return NextResponse.json(body);
};
