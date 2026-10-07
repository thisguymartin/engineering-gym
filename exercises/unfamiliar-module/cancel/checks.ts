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

cases.push({ name: 'cancellation drains active work then rejects without starting next', run: async () => {
  const controller = new AbortController();
  const gate = Promise.withResolvers<void>();
  const seen: string[] = [];
  const cancelled = new Error('cancelled by learner');
  const pending = run([{ id: 'a' }, { id: 'b' }], async job => {
    seen.push(job.id); await gate.promise;
  }, controller.signal);
  const outcome = pending.then(value => ({ value, error: null }), error => ({ value: null, error }));
  controller.abort(cancelled); gate.resolve();
  const result = await outcome;
  assert.equal(result.error, cancelled);
  assert.deepEqual(seen, ['a']);
} });
cases.push({ name: 'already aborted empty queue rejects', run: async () => {
  const controller = new AbortController(); const reason = new Error('already cancelled'); controller.abort(reason);
  await assert.rejects(run([], async () => {}, controller.signal), error => error === reason);
} });

cases.push({ name: 'job failure propagates', run: async () => {
  const reason = new Error('synthetic work failed');
  await assert.rejects(run([{ id: 'a' }], async () => { throw reason; }), error => error === reason);
} });

cases.push({ name: 'cancellation during final job still rejects', run: async () => {
  const controller = new AbortController(); const gate = Promise.withResolvers<void>();
  const reason = new Error('cancelled final job');
  const pending = run([{ id: 'a' }], async () => { await gate.promise; }, controller.signal);
  const outcome = pending.then(() => null, error => error);
  controller.abort(reason); gate.resolve();
  assert.equal(await outcome, reason);
} });
