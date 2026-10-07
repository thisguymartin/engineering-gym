import assert from 'node:assert/strict';
import { run } from './starter/solution.ts';
export const cases = [
  { name: 'empty queue completes', run: async () => { assert.deepEqual(await run([], async () => {}), []); } },
  { name: 'waits for work and starts serially', run: async () => {
    const gate = Promise.withResolvers<void>();
    const seen: string[] = [];
    let settled = false;
    const pending = run([{ id: 'a' }, { id: 'b' }], async job => {
      seen.push(job.id); if (job.id === 'a') await gate.promise;
    }).then(value => { settled = true; return value; });
    await Promise.resolve();
    const earlySeen = [...seen]; const earlySettled = settled;
    gate.resolve();
    const result = await pending;
    assert.deepEqual(earlySeen, ['a']);
    assert.equal(earlySettled, false);
    assert.deepEqual(result, ['a', 'b']);
  } },
];

cases.push({ name: 'job failure propagates', run: async () => {
  const reason = new Error('synthetic work failed');
  await assert.rejects(run([{ id: 'a' }], async () => { throw reason; }), error => error === reason);
} });
