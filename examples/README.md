# Pick one small practice session

| Goal | Example | Start |
| --- | --- | --- |
| Maintain | “Can I still reproduce and fix a duplicate-delivery race myself?” | `npm run gym -- start duplicate-delivery --mode independent --goal maintain` |
| Deepen | “I use indexes but want to justify column order from a real plan.” | `npm run gym -- start slow-query --mode coached --goal deepen` |
| Expand | “I need to understand cancellation before building a worker.” | `npm run gym -- start unfamiliar-module --variation cancel --mode guided --goal expand` |

For optional coaching, tell your agent:

> Read `skills/practice/SKILL.md`. Use this checkout as the gym root. Help me
> deepen my query-plan reasoning with hints, not a finished implementation.

A work-derived prompt should contain only an approved synthetic description:

> Practice this concept: a fictional invoice event can arrive twice, and two
> deliveries can interleave. The only side effect is a local ledger row.

Do not paste an employer's code, records, logs, secrets or conversations.
There is no importer, repository scanner, provider call or job-market scraper.

After a session, edit `.gym/<id>/review.json`:

```json
{
  "result": "partial",
  "evidence": "My serial retry test passes; the barrier reproduces two writes.",
  "unresolved": "Which writes must share a transaction?",
  "revisit": "2026-10-14"
}
```

Use your actual observations and date, then run `npm run gym -- record <id>`.
One week is a starting suggestion. `npm run gym -- due` shows both overdue and
future dates in UTC. Clear a revisit by recording a new review with `null`.
Try `rollback`, `recent`, or `cancel` later in a fresh workspace; do not copy an old
solution and call it transfer. Record previous solution exposure if it influences
the current attempt. Use `assist <id> --mode coached --hint "..." --solution`
when you see an answer; omit `--solution` for a hint.

Diagrams: [architecture](diagrams/architecture.excalidraw),
[practice loop](diagrams/workflow.excalidraw), [CI boundaries](diagrams/integrity.excalidraw).
Each has matching `.mmd` source and a `.png` preview in this directory.
Open editable files in your local Excalidraw; nothing requires a hosted diagram service.

Private history commands, from the gym root:

```sh
npm run gym -- history
npm run gym -- export /private/new-file.json
npm run gym -- delete <attempt-id> --yes
```

Choose an actual private export path; existing files are never overwritten.
Exports contain records and check output, not workspace code. Deletion removes
only the selected attempt and its records. Back up malformed data before repairing
it; the helper never silently discards it. Run checks again after each code edit.
An independent-solve label requires self-reported independent completion, a
passing last check, and no recorded assistance; it still does not certify ability.

## Terminal demo

The [README GIF](demo/walkthrough.gif) shows an independent starter failing its
intended check, a partial review, and a later variation. It does not reveal a
solution or claim an independently solved exercise. [Captured command output](demo/session.json)
is saved alongside the GIF; the animation condenses that output.

To regenerate it from current code:

```sh
uv run --no-project --with pillow==12.3.0 python examples/demo/create.py
```

This optional authoring tool needs Node/npm, Python, uv and Pillow. It runs the
commands in a disposable checkout, leaving your `.gym/` untouched. Viewing the GIF
requires no additional software. Font paths can be supplied through `GYM_DEMO_FONT`
and `GYM_DEMO_MONO_FONT` if the standard macOS/Linux fonts are unavailable.
