import { DatabaseSync } from 'node:sqlite';
export type Delivery = { id: string; amount: number };
export type Hooks = { beforeCommit?: () => Promise<void>; afterWrite?: () => void };
export function openLedger(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE IF NOT EXISTS receipts (id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS ledger (event_id TEXT NOT NULL, amount INTEGER NOT NULL);`);
  return db;
}
export function barrier(parties: number) {
  let arrived = 0;
  const gate = Promise.withResolvers<void>();
  return async () => { if (++arrived === parties) gate.resolve(); await gate.promise; };
}
