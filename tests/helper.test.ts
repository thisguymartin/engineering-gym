import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import {
  ROOT,
  all,
  assist,
  catalog,
  check,
  due,
  events,
  exportData,
  load,
  record,
  remove,
  start,
} from '../scripts/lib.ts';
function fixture(fn: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'gym-helper-'));
  cpSync(join(ROOT, 'exercises'), join(root, 'exercises'), { recursive: true });
  try {
    fn(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
function review(root: string, id: string, revisit: string | null = null) {
  writeFileSync(
    join(root, '.gym', id, 'review.json'),
    JSON.stringify({
      result: 'completed',
      evidence: 'Synthetic example: traced two deliveries at the barrier.',
      unresolved: 'How would a remote side effect change this?',
      revisit,
    }),
  );
}
test('fresh private workspaces exclude references and preserve existing attempts', () =>
  fixture((root) => {
    const first = start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'first');
    assert.equal(first.version, 1);
    assert.ok(!existsSync(join(root, '.gym/first/workspace/reference')));
    writeFileSync(join(root, '.gym/first/workspace/starter/solution.ts'), 'learner work');
    start(root, 'duplicate-delivery', 'rollback', 'coached', 'deepen', 'second');
    assert.throws(
      () => start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'first'),
      /already exists/,
    );
    assert.equal(
      readFileSync(join(root, '.gym/first/workspace/starter/solution.ts'), 'utf8'),
      'learner work',
    );
    assert.deepEqual(readdirSync(join(root, '.gym')), ['first', 'second']);
  }));
test('invalid identifiers, modes and variations fail before creating state', () =>
  fixture((root) => {
    assert.throws(
      () => start(root, 'unknown', 'base', 'independent', 'maintain'),
      /Unknown exercise/,
    );
    assert.throws(
      () => start(root, 'duplicate-delivery', 'unknown', 'independent', 'maintain'),
      /Unknown variation/,
    );
    assert.throws(
      () => start(root, 'duplicate-delivery', 'base', 'invalid' as 'independent', 'maintain'),
      /Invalid mode/,
    );
    for (const id of ['../escape', '/tmp/escape', '..', 'a/b', 'a\\b'])
      assert.throws(
        () => start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', id),
        /Invalid identifier/,
      );
    assert.ok(!existsSync(join(root, '.gym')));
  }));
test('refuses symbolic links into unrelated directories', () =>
  fixture((root) => {
    const external = mkdtempSync(join(tmpdir(), 'gym-external-'));
    try {
      symlinkSync(external, join(root, '.gym'));
      assert.throws(
        () => start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'unsafe'),
        /symbolic link/,
      );
      assert.equal(readdirSync(external).length, 0);
      rmSync(join(root, '.gym'));
      start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'safe');
      symlinkSync(external, join(root, '.gym/safe/workspace/escape'));
      assert.throws(() => check(root, 'safe'), /symbolic link/);
      assert.throws(() => remove(root, 'safe'), /symbolic link/);
    } finally {
      rmSync(external, { recursive: true, force: true });
    }
  }));
test('assistance and solution exposure stay in history across later reviews', () =>
  fixture((root) => {
    start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'first');
    review(root, 'first', '2027-01-01');
    assert.equal(record(root, 'first').independentlySolved, false);
    cpSync(
      join(root, 'exercises/duplicate-delivery/base/reference'),
      join(root, '.gym/first/workspace/starter'),
      { recursive: true },
    );
    assert.equal(check(root, 'first').passed, true);
    assert.equal(record(root, 'first').independentlySolved, true);
    assist(root, 'first', 'coached', 'Hint about transaction scope', false);
    assist(root, 'first', 'guided', 'Read reference solution', true);
    assert.throws(
      () => assist(root, 'first', 'independent', 'reset label', false),
      /fresh attempt/,
    );
    assert.equal(record(root, 'first').independentlySolved, false);
    assert.equal(all(root)[0].events.filter((e) => e.kind === 'review').length, 3);
    assert.equal(due(root, '2027-01-02')[0].due, true);
    review(root, 'first', null);
    record(root, 'first');
    assert.deepEqual(due(root), []);
  }));
test('malformed history, reviews and unavailable versions are not silently discarded', () =>
  fixture((root) => {
    start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'first');
    assert.throws(() => record(root, 'first'), /nonempty/);
    const path = join(root, '.gym/first/review.json');
    review(root, 'first', '2027-02-30');
    assert.throws(() => record(root, 'first'), /real YYYY/);
    writeFileSync(path, '{bad');
    assert.throws(() => record(root, 'first'), /preserved/);
    assert.equal(readFileSync(path, 'utf8'), '{bad');
    const bad = join(root, '.gym/first/events/1000000000000-abc.json');
    writeFileSync(bad, '{bad');
    assert.throws(() => due(root), /preserved/);
    assert.throws(() => check(root, 'first'), /preserved/);
    rmSync(bad);
    const meta = join(root, 'exercises/duplicate-delivery/exercise.json');
    const metadata = JSON.parse(readFileSync(meta, 'utf8'));
    delete metadata.version;
    writeFileSync(meta, JSON.stringify(metadata));
    assert.throws(() => catalog(root), /version/);
    metadata.version = 2;
    writeFileSync(meta, JSON.stringify(metadata));
    assert.throws(() => load(root, 'first'), /version/);
    remove(root, 'first');
    assert.ok(!existsSync(join(root, '.gym/first')));
  }));
test('exports validated records exclusively and deletes only the selected attempt', () =>
  fixture((root) => {
    assert.deepEqual(due(root), []);
    for (const id of ['first', 'second'])
      start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', id);
    const output = join(root, 'export.json');
    exportData(root, output);
    assert.equal(JSON.parse(readFileSync(output, 'utf8')).attempts.length, 2);
    assert.throws(() => exportData(root, output), /EEXIST/);
    remove(root, 'first');
    assert.equal(all(root).length, 1);
  }));
test('checks return real failures, record output and strip production credentials', () =>
  fixture((root) => {
    start(root, 'duplicate-delivery', 'base', 'independent', 'maintain', 'first');
    assert.equal(check(root, 'first').passed, false);
    const path = join(root, '.gym/first/workspace');
    writeFileSync(
      join(path, 'checks.ts'),
      "export const cases = [{ name: 'no credentials', run() { if (process.env.GYM_SYNTHETIC_SECRET || process.env.NODE_OPTIONS || process.env.HOME) throw new Error('inherited secret'); } }];\n",
    );
    process.env.GYM_SYNTHETIC_SECRET = 'synthetic-only';
    try {
      assert.equal(check(root, 'first').passed, true);
    } finally {
      delete process.env.GYM_SYNTHETIC_SECRET;
    }
    writeFileSync(
      join(path, 'starter/solution.ts'),
      "import 'a-dependency-that-is-not-installed';",
    );
    writeFileSync(
      join(path, 'checks.ts'),
      "import './starter/solution.ts'; export const cases = [];\n",
    );
    const result = check(root, 'first');
    assert.equal(result.passed, false);
    assert.match(result.output, /ERR_MODULE_NOT_FOUND/);
    assert.equal(events(join(root, '.gym/first')).length, 3);
  }));
test('CLI rejects wrong options and unsafe paths with actionable exit codes', () => {
  for (const args of [
    ['start', 'unknown'],
    ['start', 'duplicate-delivery', '--mode', 'wrong'],
    ['check', '../unsafe'],
    ['delete', 'missing'],
    ['list', '--surprise'],
    ['start', 'duplicate-delivery', '--id', 'a', '--id', 'b'],
  ]) {
    const result = spawnSync(process.execPath, [join(ROOT, 'scripts/gym.ts'), ...args], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 2, result.stdout + result.stderr);
  }
});
test('core works without node_modules or provider configuration', () =>
  fixture((root) => {
    cpSync(join(ROOT, 'scripts'), join(root, 'scripts'), { recursive: true });
    writeFileSync(join(root, 'package.json'), '{"type":"module"}');
    const cli = (...args: string[]) =>
      spawnSync(process.execPath, [join(root, 'scripts/gym.ts'), ...args], {
        encoding: 'utf8',
        env: {},
      });
    assert.equal(cli('list').status, 0);
    assert.equal(cli('start', 'duplicate-delivery', '--id', 'offline').status, 0);
    assert.equal(cli('check', 'offline').status, 1);
    review(root, 'offline');
    assert.equal(cli('record', 'offline').status, 0);
    assert.equal(cli('due').status, 0);
    assert.equal(cli('export', join(root, 'private-export.json')).status, 0);
    assert.equal(cli('delete', 'offline', '--yes').status, 0);
  }));
