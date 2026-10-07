export type Job = { id: string };
export type Work = (job: Job) => Promise<void>;
export async function run(jobs: Job[], work: Work, signal?: AbortSignal): Promise<string[]> {
  const completed: string[] = [];
  await Promise.all(jobs.map(async job => {
    if (signal?.aborted) return;
    await work(job);
    completed.push(job.id);
  }));
  return completed;
}
