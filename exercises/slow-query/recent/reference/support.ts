import { DatabaseSync } from 'node:sqlite';
export function seed() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE tickets (id INTEGER PRIMARY KEY, tenant_id INTEGER, status TEXT, created_at INTEGER, title TEXT)');
  const insert = db.prepare('INSERT INTO tickets VALUES (?, ?, ?, ?, ?)');
  db.exec('BEGIN');
  for (let id = 1; id <= 12000; id++) insert.run(id, id % 13, id % 3 === 0 ? 'open' : 'closed', Math.floor(id / 4), `Synthetic ticket ${id}`);
  db.exec('COMMIT');
  return db;
}
export type Filter = { tenant: number; status: string; after: number; limit: number };
export type Ticket = { id: number; title: string; created_at: number };
