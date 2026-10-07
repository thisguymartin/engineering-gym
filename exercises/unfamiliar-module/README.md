# Unfamiliar module · v1

Target: predict when an async queue finishes, then correct its observable behavior.
Prerequisites: promises, async/await, arrays; AbortSignal for `cancel`.
Allow 20–35 minutes. All jobs are synthetic and gates are explicitly released;
there are no timing sleeps.

Before execution, read `starter/solution.ts`. Predict which jobs have started and
whether `run` has settled while the first job waits on a promise. Put your prediction
in `notes.md`, then compare it with the acceptance trace. Explain the discrepancy.

For `base`, run jobs one at a time in input order, resolve only after the last job,
and return completed IDs in order. Empty input returns an empty list.
The supplied base jobs do not reject; error recovery is outside this version's
contract. Add a regression test for an observable ordering/completion property.

For the later `cancel` variation, an already aborted signal rejects, including
empty input. If cancellation arrives during active work, drain that work, reject
with the signal's reason, and never start another job. The callback does not support
interruption. An active job failure should propagate. Add or explain a regression
for cancellation during the final job, not just between two jobs.

Run `npm run gym -- check <attempt-id>`. Edit `starter/solution.ts` and optionally
`regression.test.ts`. Connect your explanation to an actual execution trace; passing
tests alone do not show you understand promise scheduling. Reference implementations
are in each variation's `reference/`, excluded from starter copies.
