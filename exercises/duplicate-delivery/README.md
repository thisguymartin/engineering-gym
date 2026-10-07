# Duplicate delivery · v1

Target: make one persisted ledger entry per event ID. Prerequisites: promises,
SQL inserts, and a basic understanding of transactions. Allow 25–40 minutes.
The synthetic ledger is the entire side effect; no external payments are made.

Before running: predict what happens when two deliveries both reach
`beforeCommit` before either resumes. Write your invariant and prediction in
`notes.md`. The barrier releases both callers without random sleeps.

Edit `solution.ts`. For `base`, preserve distinct events, tolerate repeated and
interleaved delivery, and survive closing/reopening the database. Event payloads
for a given ID are immutable. Keep the supplied hook callable before entering
any synchronous critical section; do not put an await inside a transaction.

For `rollback`, also propagate a fault injected by `afterWrite`, leave neither
a receipt nor ledger effect after failure, and allow a later retry. This changes
the failure boundary from delivery duplication to failure inside the local write.

Run `npm run gym -- check <attempt-id>` from the gym root. Checks live in your
workspace; add a case to `regression.test.ts` (or explain why an existing case
rejects your previous implementation in `notes.md`). Explain the atomicity
boundary and a counterexample involving an external service. A local SQLite
transaction cannot establish universal exactly-once execution across systems.

Reference solutions are under each variation's `reference/`; open only when
requesting an answer or reviewing a finished attempt. Both variations use the
same robust reference, but different acceptance checks. Try rollback later in a
fresh workspace without looking back at your previous solution.
