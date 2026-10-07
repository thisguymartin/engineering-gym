import type { DatabaseSync } from 'node:sqlite';
import type { Filter, Ticket } from './support.ts';
export const query = 'SELECT id, title, created_at FROM tickets WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC, id DESC LIMIT ?';
export function prepare(db: DatabaseSync) {
  db.exec('CREATE INDEX IF NOT EXISTS tickets_lookup ON tickets (tenant_id, status, created_at DESC, id DESC)');
}
export function parameters(filter: Filter) { return [filter.tenant, filter.status, filter.limit]; }
export function search(db: DatabaseSync, filter: Filter): Ticket[] {
  return db.prepare(query).all(...parameters(filter)) as Ticket[];
}
