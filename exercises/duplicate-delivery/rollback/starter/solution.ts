import type { DatabaseSync } from 'node:sqlite';
import type { Delivery, Hooks } from './support.ts';
export async function deliver(db: DatabaseSync, event: Delivery, hooks: Hooks = {}) {
  if (db.prepare('SELECT id FROM receipts WHERE id = ?').get(event.id)) return;
  await hooks.beforeCommit?.();
  db.prepare('INSERT INTO ledger VALUES (?, ?)').run(event.id, event.amount);
  hooks.afterWrite?.();
  db.prepare('INSERT OR IGNORE INTO receipts VALUES (?)').run(event.id);
}
