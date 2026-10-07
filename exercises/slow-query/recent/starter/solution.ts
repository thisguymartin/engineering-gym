import type { DatabaseSync } from 'node:sqlite';
import type { Filter, Ticket } from './support.ts';
export const query = 'SELECT id, title, created_at FROM tickets WHERE tenant_id = ? AND created_at >= ? ORDER BY created_at DESC, id DESC LIMIT ?';
export function prepare(_db: DatabaseSync) {
  // Add a justified schema/index improvement without modifying the rows.
}
export function parameters(filter: Filter) { return [filter.tenant, filter.after, filter.limit]; }
export function search(db: DatabaseSync, filter: Filter): Ticket[] {
  return db.prepare(query).all(...parameters(filter)) as Ticket[];
}
