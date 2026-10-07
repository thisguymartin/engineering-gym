import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const modes = ['independent', 'coached', 'guided'] as const;
export type Mode = (typeof modes)[number];
export type Exercise = { id: string; version: number; target: string; variations: string[] };
export type Attempt = {
  schema: 1;
  id: string;
  exercise: string;
  version: number;
  variation: string;
  created: string;
  mode: Mode;
  goal: 'maintain' | 'deepen' | 'expand';
};
export type Review = {
  result: 'completed' | 'partial' | 'stuck';
  evidence: string;
  unresolved: string;
  revisit: string | null;
};
export type Event = { at: string } & (
  | { kind: 'assistance'; mode: Mode; hint: string; solutionExposed: boolean }
  | { kind: 'check'; passed: boolean; output: string }
  | { kind: 'review'; review: Review; independentlySolved: boolean }
);
export function identifier(value: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) || value.length > 100)
    throw new Error(`Invalid identifier: ${value}`);
  return value;
}
function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
}
function nonempty(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Expected nonempty text');
}
export function mode(value: string): Mode {
  if (!modes.includes(value as Mode)) throw new Error(`Invalid mode: ${value}`);
  return value as Mode;
}
function timestamp(value: unknown) {
  if (
    typeof value !== 'string' ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString() !== value
  )
    throw new Error('Invalid timestamp');
}
export function readJSON(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${path}; existing data preserved: ${String(error)}`);
  }
}
export function catalog(root = ROOT): Exercise[] {
  return readdirSync(join(root, 'exercises'))
    .sort()
    .map((id) => {
      identifier(id);
      const value = readJSON(join(root, 'exercises', id, 'exercise.json'));
      object(value);
      if (value.id !== id || !Number.isInteger(value.version) || Number(value.version) < 1)
        throw new Error(`Invalid exercise/version: ${id}`);
      nonempty(value.target);
      if (
        !Array.isArray(value.variations) ||
        !value.variations.length ||
        new Set(value.variations).size !== value.variations.length
      )
        throw new Error(`Invalid variations: ${id}`);
      value.variations.forEach((v) => {
        nonempty(v);
        identifier(v);
      });
      return value as Exercise;
    });
}
// Refuse symbolic links at every existing component before reading or changing private data.
export function safePath(root: string, ...parts: string[]) {
  const base = realpathSync(root);
  let current = base;
  for (const part of parts) {
    if (part !== '.gym') identifier(part);
    current = join(current, part);
    if (
      existsSync(current) ||
      (() => {
        try {
          lstatSync(current);
          return true;
        } catch {
          return false;
        }
      })()
    ) {
      if (lstatSync(current).isSymbolicLink()) throw new Error(`Unsafe symbolic link: ${current}`);
    }
  }
  return current;
}
function ensureTree(path: string) {
  if (lstatSync(path).isSymbolicLink()) throw new Error(`Unsafe symbolic link: ${path}`);
  if (lstatSync(path).isDirectory())
    for (const entry of readdirSync(path)) ensureTree(join(path, entry));
}
function writeNew(path: string, value: unknown) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
export function start(
  root: string,
  exerciseId: string,
  variation: string,
  assistance: Mode,
  goal: Attempt['goal'],
  id = `${exerciseId}-${randomUUID()}`,
) {
  mode(assistance);
  identifier(id);
  identifier(variation);
  if (!['maintain', 'deepen', 'expand'].includes(goal)) throw new Error('Invalid goal');
  const exercise = catalog(root).find((e) => e.id === exerciseId);
  if (!exercise) throw new Error(`Unknown exercise: ${exerciseId}`);
  if (!exercise.variations.includes(variation)) throw new Error(`Unknown variation: ${variation}`);
  const path = safePath(root, '.gym', id);
  if (existsSync(path)) throw new Error(`Attempt already exists: ${id}`);
  const source = join(root, 'exercises', exerciseId, variation);
  ensureTree(source);
  const attempt: Attempt = {
    schema: 1,
    id,
    exercise: exerciseId,
    version: exercise.version,
    variation,
    mode: assistance,
    goal,
    created: new Date().toISOString(),
  };
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  mkdirSync(path, { mode: 0o700 });
  try {
    const workspace = join(path, 'workspace');
    mkdirSync(workspace);
    cpSync(join(source, 'starter'), join(workspace, 'starter'), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    cpSync(join(source, 'checks.ts'), join(workspace, 'checks.ts'));
    cpSync(join(root, 'exercises', exerciseId, 'README.md'), join(workspace, 'README.md'));
    writeFileSync(
      join(workspace, 'regression.test.ts'),
      "import { test } from 'node:test';\ntest.todo('Add your regression, or explain an existing acceptance case in notes.md');\n",
    );
    writeFileSync(
      join(workspace, 'notes.md'),
      '# Before running\n\nPrediction / invariant:\n\n# After running\n\nObserved evidence / explanation / regression:\n',
    );
    writeNew(join(path, 'attempt.json'), attempt);
    writeNew(join(path, 'review.json'), {
      result: 'partial',
      evidence: '',
      unresolved: '',
      revisit: null,
    });
    mkdirSync(join(path, 'events'));
  } catch (error) {
    rmSync(path, { recursive: true, force: true });
    throw error;
  }
  return attempt;
}
export function load(root: string, id: string) {
  const path = safePath(root, '.gym', id);
  ensureTree(path);
  const value = readJSON(join(path, 'attempt.json'));
  object(value);
  if (value.schema !== 1 || value.id !== id) throw new Error('Invalid attempt identity/schema');
  nonempty(value.exercise);
  identifier(value.exercise);
  nonempty(value.variation);
  identifier(value.variation);
  mode(String(value.mode));
  timestamp(value.created);
  if (!['maintain', 'deepen', 'expand'].includes(String(value.goal)))
    throw new Error('Invalid goal');
  const exercise = catalog(root).find((e) => e.id === value.exercise);
  if (
    !exercise ||
    exercise.version !== value.version ||
    !exercise.variations.includes(value.variation)
  )
    throw new Error(
      'Exercise version/variation unavailable; restore the matching catalog before continuing',
    );
  return { path, attempt: value as Attempt };
}
export function validateReview(value: unknown): Review {
  object(value);
  if (!['completed', 'partial', 'stuck'].includes(String(value.result)))
    throw new Error('Invalid observed result');
  nonempty(value.evidence);
  nonempty(value.unresolved);
  if (value.revisit !== null) {
    if (
      typeof value.revisit !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(value.revisit) ||
      !Number.isFinite(Date.parse(value.revisit)) ||
      new Date(value.revisit).toISOString().slice(0, 10) !== value.revisit
    )
      throw new Error('Revisit must be a real YYYY-MM-DD date or null');
  }
  return value as Review;
}
export function events(path: string): Event[] {
  return readdirSync(join(path, 'events'))
    .sort()
    .map((file) => {
      if (!/^\d{13}-[a-f0-9-]+\.json$/.test(file))
        throw new Error(`Unrecognized history file: ${file}`);
      const value = readJSON(join(path, 'events', file));
      object(value);
      timestamp(value.at);
      if (value.kind === 'assistance') {
        mode(String(value.mode));
        nonempty(value.hint);
        if (typeof value.solutionExposed !== 'boolean') throw new Error('Invalid exposure');
        if (value.mode === 'independent' && value.solutionExposed)
          throw new Error('Solution exposure requires coached/guided mode');
      } else if (value.kind === 'check') {
        if (typeof value.passed !== 'boolean' || typeof value.output !== 'string')
          throw new Error('Invalid check record');
      } else if (value.kind === 'review') {
        validateReview(value.review);
        if (typeof value.independentlySolved !== 'boolean')
          throw new Error('Invalid review classification');
      } else throw new Error('Unknown history event');
      return value as Event;
    });
}
function append(path: string, event: Event) {
  events(path);
  const last = readdirSync(join(path, 'events')).sort().at(-1);
  const sequence = Math.max(Date.now(), last ? Number(last.slice(0, 13)) + 1 : 0);
  writeNew(join(path, 'events', `${sequence}-${randomUUID()}.json`), event);
}
export function assist(
  root: string,
  id: string,
  assistance: Mode,
  hint: string,
  solutionExposed: boolean,
) {
  const { path } = load(root, id);
  mode(assistance);
  nonempty(hint);
  if (assistance === 'independent')
    throw new Error(
      'Assistance switches this session to coached or guided; start a fresh attempt for independence',
    );
  append(path, {
    kind: 'assistance',
    at: new Date().toISOString(),
    mode: assistance,
    hint,
    solutionExposed,
  });
}
export function checkWorkspace(workspace: string, root = ROOT) {
  // Deliberately omit inherited credentials, NODE_OPTIONS and provider configuration.
  const env = Object.fromEntries(
    ['PATH', 'TMPDIR', 'TEMP', 'TMP', 'SystemRoot'].flatMap((k) =>
      process.env[k] ? [[k, process.env[k]!]] : [],
    ),
  );
  const acceptance = spawnSync(
    process.execPath,
    [join(root, 'scripts/check-worker.ts'), workspace],
    { cwd: workspace, env, encoding: 'utf8', timeout: 15000 },
  );
  const regression = spawnSync(process.execPath, ['--test', 'regression.test.ts'], {
    cwd: workspace,
    env,
    encoding: 'utf8',
    timeout: 15000,
  });
  const output = [
    acceptance.stdout,
    acceptance.stderr,
    acceptance.error?.message,
    regression.stdout,
    regression.stderr,
    regression.error?.message,
  ]
    .filter(Boolean)
    .join('\n');
  return { passed: acceptance.status === 0 && regression.status === 0, output, acceptance };
}
export function check(root: string, id: string) {
  const { path } = load(root, id);
  events(path);
  const result = checkWorkspace(join(path, 'workspace'));
  append(path, {
    kind: 'check',
    at: new Date().toISOString(),
    passed: result.passed,
    output: result.output,
  });
  return result;
}
export function record(root: string, id: string) {
  const { path, attempt } = load(root, id);
  const history = events(path);
  const review = validateReview(readJSON(join(path, 'review.json')));
  const lastCheck = history.filter((e) => e.kind === 'check').at(-1);
  const independentlySolved =
    lastCheck?.passed === true &&
    review.result === 'completed' &&
    attempt.mode === 'independent' &&
    !history.some((e) => e.kind === 'assistance');
  append(path, { kind: 'review', at: new Date().toISOString(), review, independentlySolved });
  return { review, independentlySolved, independence: 'self-reported' };
}
export function all(root: string) {
  const path = safePath(root, '.gym');
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .sort()
    .map((id) => {
      const item = load(root, id);
      return { ...item.attempt, events: events(item.path) };
    });
}
export function due(root: string, today = new Date().toISOString().slice(0, 10)) {
  return all(root)
    .flatMap((attempt) => {
      const latest = attempt.events.filter((e) => e.kind === 'review').at(-1);
      return latest?.review.revisit
        ? [
            {
              id: attempt.id,
              exercise: attempt.exercise,
              variation: attempt.variation,
              revisit: latest.review.revisit,
              due: latest.review.revisit <= today,
            },
          ]
        : [];
    })
    .sort((a, b) => a.revisit.localeCompare(b.revisit));
}
export function remove(root: string, id: string) {
  // Deletion remains available for malformed data; require identity and safe tree, not parsing.
  const path = safePath(root, '.gym', identifier(id));
  ensureTree(path);
  rmSync(path, { recursive: true });
}
export function exportData(root: string, output: string) {
  const target = resolve(output);
  if (basename(target) === 'attempt.json') throw new Error('Choose a separate export file');
  const data = all(root);
  writeNew(target, { schema: 1, exported: new Date().toISOString(), attempts: data });
}
