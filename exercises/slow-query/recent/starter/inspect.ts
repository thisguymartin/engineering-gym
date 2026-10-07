import { seed } from './support.ts';
import { prepare, query, parameters, search } from './solution.ts';
const db = seed();
try {
  const filter = { tenant: 7, status: 'open', after: 2400, limit: 23 };
  console.log(db.prepare('SELECT sqlite_version() AS version').get());
  console.log('Before:', db.prepare('EXPLAIN QUERY PLAN ' + query).all(...parameters(filter)));
  prepare(db);
  console.log('After:', db.prepare('EXPLAIN QUERY PLAN ' + query).all(...parameters(filter)));
  console.log(search(db, filter));
} finally { db.close(); }
