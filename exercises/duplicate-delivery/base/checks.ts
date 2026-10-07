import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deliver } from './starter/solution.ts';
import { openLedger, barrier } from './starter/support.ts';
const event = { id: 'invoice-1', amount: 25 };
export const cases = [
  { name: 'sequential retries and distinct events', run: async () => {
    const db = openLedger();
    try {
      await deliver(db, event); await deliver(db, event);
      await deliver(db, { id: 'invoice-2', amount: 10 });
      assert.equal(db.prepare('SELECT SUM(amount) AS total FROM ledger').get()?.total, 35);
    } finally { db.close(); }
  } },
  { name: 'interleaved duplicate writes once', run: async () => {
    const db = openLedger();
    try {
      const beforeCommit = barrier(2);
      await Promise.all([deliver(db, event, { beforeCommit }), deliver(db, event, { beforeCommit })]);
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM ledger').get()?.n, 1);
    } finally { db.close(); }
  } },
  { name: 'receipt survives reopening database', run: async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gym-ledger-'));
    try {
      const first = openLedger(join(dir, 'ledger.sqlite'));
      try { await deliver(first, event); } finally { first.close(); }
      const next = openLedger(join(dir, 'ledger.sqlite'));
      try {
        await deliver(next, event);
        assert.equal(next.prepare('SELECT COUNT(*) AS n FROM ledger').get()?.n, 1);
      } finally { next.close(); }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  } },
];
