# Slow query · v1

Target: investigate a tenant-scoped ticket listing without changing its results.
Prerequisites: SELECT, WHERE, ORDER BY, indexes. Allow 25–40 minutes.
The fixture seeds 12,000 synthetic rows in local in-memory SQLite each run.
No database server, download, Docker, or saved production data is needed.

Predict the plan before running `node .gym/<attempt-id>/workspace/starter/inspect.ts`
from the gym root. Record the SQLite version printed by inspection. `base` filters
by tenant and status. `recent` removes status and adds a creation-time lower bound;
its ordering is still newest first, then highest ID to resolve ties.

Edit `starter/solution.ts`: preserve filters, selected fields, ties, empty results,
and limits. Do not modify seeded rows or replace the SQL query with a JS scan.
Justify an index using the observed plan; include its write/storage tradeoff.
Acceptance requires an indexed SEARCH and no temporary ordering B-tree, without
pinning an entire plan string or using wall-clock thresholds. This is a deliberately
narrow SQLite exercise, not a general performance certificate. The pinned Node
24 runtime supplies SQLite; optimizer wording can change across database versions.

Run `npm run gym -- check <attempt-id>`. Add a regression in `regression.test.ts`
or explain a supplied case that prevents a faster-but-wrong query. Save your plan
observations in `notes.md`. A later `recent` attempt tests whether your index
reasoning survives a changed predicate. References live separately under each
variation's `reference/`; do not inspect them during an independent attempt.
