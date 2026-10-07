import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, catalog } from '../scripts/lib.ts';
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(directory, e.name)) : [join(directory, e.name)],
  );
}
test('skill has spec-compliant minimal metadata and valid local references', () => {
  const path = join(ROOT, 'skills/practice/SKILL.md');
  const skill = readFileSync(path, 'utf8');
  const front = skill.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(front);
  const fields = Object.fromEntries(
    front[1].split('\n').map((line) => {
      const index = line.indexOf(':');
      assert.ok(index > 0, 'Use plain scalar frontmatter fields');
      return [line.slice(0, index), line.slice(index + 1).trim()];
    }),
  );
  assert.equal(fields.name, 'practice');
  assert.match(fields.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(fields.name.length <= 64);
  assert.ok(fields.description.length > 0 && fields.description.length <= 1024);
  assert.deepEqual(Object.keys(fields).sort(), ['description', 'name']);
});
test('Markdown local links, fenced blocks and diagram assets remain intact', () => {
  const markdown = [
    join(ROOT, 'README.md'),
    ...['skills', 'exercises', 'examples'].flatMap((d) =>
      files(join(ROOT, d)).filter((f) => f.endsWith('.md')),
    ),
  ];
  for (const path of markdown) {
    const body = readFileSync(path, 'utf8');
    assert.equal((body.match(/^```/gm) ?? []).length % 2, 0, path);
    for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^(https?:|#)/.test(link)) continue;
      assert.ok(existsSync(resolve(dirname(path), link.split('#')[0])), `${path}: ${link}`);
    }
  }
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  for (const name of ['architecture', 'workflow', 'integrity']) {
    const base = join(ROOT, 'examples/diagrams', name);
    const scene = JSON.parse(readFileSync(`${base}.excalidraw`, 'utf8'));
    assert.equal(scene.type, 'excalidraw');
    assert.equal(scene.version, 2);
    assert.ok(scene.elements.length > 0);
    assert.equal(
      new Set(scene.elements.map((e: { id: string }) => e.id)).size,
      scene.elements.length,
    );
    assert.equal(readFileSync(`${base}.png`).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    if (name !== 'integrity')
      assert.ok(
        readme.includes(readFileSync(`${base}.mmd`, 'utf8').trim()),
        `${name} Mermaid drift`,
      );
  }
});
test('starters do not import references or remote dependencies', () => {
  for (const exercise of catalog())
    for (const variation of exercise.variations) {
      const starter = join(ROOT, 'exercises', exercise.id, variation, 'starter');
      for (const path of files(starter)) {
        const code = readFileSync(path, 'utf8');
        for (const match of code.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)) {
          const specifier = match[1];
          assert.ok(specifier.startsWith('node:') || specifier.startsWith('./'), path);
          if (specifier.startsWith('./'))
            assert.ok(existsSync(resolve(dirname(path), specifier)), path);
        }
        assert.doesNotMatch(code, /reference\//);
      }
    }
});
test('Git ignores workspaces and records', () => {
  const result = spawnSync(
    'git',
    [
      'check-ignore',
      '--no-index',
      '.gym/sample/workspace/starter/solution.ts',
      '.gym/sample/events/example.json',
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim().split('\n').length, 2);
});
test('coaching scenarios are review fixtures, not a claimed model evaluation', () => {
  const scenarios = JSON.parse(
    readFileSync(join(ROOT, 'examples/coaching-scenarios.json'), 'utf8'),
  );
  assert.ok(scenarios.scenarios.length >= 7);
  assert.equal(
    new Set(scenarios.scenarios.map((s: { id: string }) => s.id)).size,
    scenarios.scenarios.length,
  );
  for (const scenario of scenarios.scenarios) assert.ok(scenario.request && scenario.expect);
});
