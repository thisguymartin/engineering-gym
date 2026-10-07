import assert from 'node:assert/strict';
import { prepare, search, query, parameters } from './starter/solution.ts';
import { seed } from './starter/support.ts';
export const cases = [
  { name: 'preserves filtering ordering ties and limits', run: () => {
    const db = seed();
    try {
      const original = db.prepare('SELECT * FROM tickets').all() as { id: number; tenant_id: number; status: string; created_at: number; title: string }[];
      prepare(db);
      assert.deepEqual(db.prepare('SELECT * FROM tickets').all(), original, 'Do not change input data');
      for (const tenant of [0, 7, 12, 99]) for (const status of ['open', 'closed']) for (const limit of [0, 1, 23]) {
        const filter = { tenant, status, after: 2400, limit };
        const expected = original.filter(r => r.tenant_id === tenant && r.created_at >= filter.after)
          .sort((a,b) => b.created_at - a.created_at || b.id - a.id).slice(0, limit)
          .map(({ id, title, created_at }) => ({ id, title, created_at }));
        assert.deepEqual(search(db, filter).map(r => ({ ...r })), expected);
      }
    } finally { db.close(); }
  } },
  { name: 'uses indexed search without temporary ordering', run: () => {
    const db = seed();
    try {
      prepare(db);
      const plan = db.prepare('EXPLAIN QUERY PLAN ' + query).all(...parameters({ tenant: 7, status: 'open', after: 2400, limit: 23 }));
      const detail = plan.map(row => String(row.detail)).join(' | ');
      assert.match(detail, /SEARCH tickets USING (?:COVERING )?INDEX/i);
      assert.doesNotMatch(detail, /USE TEMP B-TREE|SCAN tickets/i);
    } finally { db.close(); }
  } },
];
