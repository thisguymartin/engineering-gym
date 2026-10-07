import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, catalog, checkWorkspace } from '../scripts/lib.ts';

type CaseResult = { name: string; passed: boolean; assertion?: boolean };
function verify(
  exercise: string,
  variation: string,
  implementation: 'starter' | 'reference',
  mutate?: (code: string) => string,
) {
  const directory = mkdtempSync(join(tmpdir(), 'gym-integrity-'));
  const source = join(ROOT, 'exercises', exercise, variation);
  try {
    cpSync(join(source, 'starter'), join(directory, 'starter'), { recursive: true });
    if (implementation === 'reference')
      cpSync(join(source, 'reference'), join(directory, 'starter'), { recursive: true });
    cpSync(join(source, 'checks.ts'), join(directory, 'checks.ts'));
    writeFileSync(join(directory, 'regression.test.ts'), "import 'node:test';\n");
    if (mutate) {
      const path = join(directory, 'starter/solution.ts');
      const original = readFileSync(path, 'utf8');
      const changed = mutate(original);
      assert.notEqual(changed, original, 'Mutation must actually change the implementation');
      writeFileSync(path, changed);
    }
    const result = checkWorkspace(directory);
    assert.ok(result.acceptance.status === 0 || result.acceptance.status === 1, result.output);
    const cases = JSON.parse(result.acceptance.stdout) as CaseResult[];
    assert.ok(cases.length > 0);
    assert.equal(new Set(cases.map((c) => c.name)).size, cases.length);
    for (const entry of cases.filter((c) => !c.passed))
      assert.equal(entry.assertion, true, result.output);
    return { ...result, cases };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
for (const exercise of catalog())
  for (const variation of exercise.variations) {
    test(`${exercise.id}/${variation}: exact starter failures and reference acceptance`, () => {
      const starter = verify(exercise.id, variation, 'starter');
      const expected = JSON.parse(
        readFileSync(join(ROOT, 'exercises', exercise.id, variation, 'baseline.json'), 'utf8'),
      );
      assert.deepEqual(
        starter.cases.filter((c) => !c.passed).map((c) => c.name),
        expected,
        starter.output,
      );
      assert.equal(starter.passed, false);
      const reference = verify(exercise.id, variation, 'reference');
      assert.equal(reference.passed, true, reference.output);
      assert.deepEqual(
        reference.cases.map((c) => c.name),
        starter.cases.map((c) => c.name),
      );
    });
  }
test('rejects dropping every event instead of deduplicating', () => {
  const result = verify('duplicate-delivery', 'base', 'reference', (code) =>
    code.replace('if (receipt.changes)', 'if (receipt.changes < 0)'),
  );
  assert.equal(result.passed, false);
  assert.ok(
    result.cases.some((c) => c.name === 'sequential retries and distinct events' && !c.passed),
  );
});
test('rejects a receipt committed before the ledger effect', () => {
  const result = verify('duplicate-delivery', 'rollback', 'reference', (code) =>
    code.replace(
      "      db.prepare('INSERT INTO ledger",
      "      db.exec('COMMIT'); db.exec('BEGIN IMMEDIATE');\n      db.prepare('INSERT INTO ledger",
    ),
  );
  assert.equal(result.passed, false);
  assert.ok(result.cases.some((c) => c.name.includes('failed transaction') && !c.passed));
});
test('rejects an indexed query leaking another tenant', () => {
  const result = verify('slow-query', 'base', 'reference', (code) =>
    code.replace('WHERE tenant_id = ?', 'WHERE tenant_id >= ?'),
  );
  assert.equal(result.passed, false);
  assert.ok(result.cases.some((c) => c.name.startsWith('preserves') && !c.passed));
});
test('rejects a status-first index for the changed filter', () => {
  const result = verify('slow-query', 'recent', 'reference', (code) =>
    code.replace('(tenant_id, created_at', '(tenant_id, status, created_at'),
  );
  assert.equal(result.passed, false);
  assert.ok(result.cases.some((c) => c.name.startsWith('uses indexed') && !c.passed));
});
test('rejects cancellation checks only before starting jobs', () => {
  const result = verify('unfamiliar-module', 'cancel', 'reference', (code) =>
    code.replace('  signal?.throwIfAborted();\n  return completed;', '  return completed;'),
  );
  assert.equal(result.passed, false);
  assert.ok(result.cases.some((c) => c.name.includes('final job') && !c.passed));
});
