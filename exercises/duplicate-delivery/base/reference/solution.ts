import type { DatabaseSync } from 'node:sqlite';
import type { Delivery, Hooks } from './support.ts';
export async function deliver(db: DatabaseSync, event: Delivery, hooks: Hooks = {}) {
  await hooks.beforeCommit?.();
  db.exec('BEGIN IMMEDIATE');
  try {
    const receipt = db.prepare('INSERT OR IGNORE INTO receipts VALUES (?)').run(event.id);
    if (receipt.changes) {
      db.prepare('INSERT INTO ledger VALUES (?, ?)').run(event.id, event.amount);
      hooks.afterWrite?.();
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
