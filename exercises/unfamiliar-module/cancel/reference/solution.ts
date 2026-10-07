export type Job = { id: string };
export type Work = (job: Job) => Promise<void>;
export async function run(jobs: Job[], work: Work, signal?: AbortSignal): Promise<string[]> {
  const completed: string[] = [];
  for (const job of jobs) {
    signal?.throwIfAborted();
    await work(job);
    completed.push(job.id);
  }
  signal?.throwIfAborted();
  return completed;
}
