import {
  ROOT,
  all,
  assist,
  catalog,
  check,
  due,
  exportData,
  mode,
  record,
  remove,
  start,
} from './lib.ts';
import type { Attempt } from './lib.ts';
const help = `engineering-gym (Node 24.12+)
  list
  start <exercise> [--variation base] [--mode independent|coached|guided]
        [--goal maintain|deepen|expand] [--id unique-name]
  check <attempt-id>
  assist <attempt-id> --mode coached|guided --hint "what was revealed" [--solution]
  record <attempt-id>       edit .gym/<id>/review.json first
  due                      scheduled revisits, UTC dates
  history                  validated local records as JSON
  export <new-file.json>    records only; deliberately choose a private path
  delete <attempt-id> --yes delete that workspace and its records`;
try {
  if (
    Number(process.versions.node.split('.')[0]) !== 24 ||
    Number(process.versions.node.split('.')[1]) < 12
  )
    throw new Error('Use Node 24.12+ (24.x); see .node-version');
  const [command = 'help', subject, ...rest] = process.argv.slice(2);
  const allowed: Record<string, string[]> = {
    start: ['variation', 'mode', 'goal', 'id'],
    assist: ['mode', 'hint', 'solution'],
    delete: ['yes'],
  };
  const options: Record<string, string> = {};
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].slice(2);
    if (!rest[i].startsWith('--') || !allowed[command]?.includes(key) || key in options)
      throw new Error(`Unknown or repeated option: ${rest[i]}`);
    if (['yes', 'solution'].includes(key)) options[key] = 'true';
    else {
      const value = rest[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
      options[key] = value;
    }
  }
  if (['list', 'due', 'history', 'help'].includes(command) && subject)
    throw new Error('Unexpected argument');
  if (['start', 'check', 'assist', 'record', 'export', 'delete'].includes(command) && !subject)
    throw new Error('Missing exercise, attempt ID, or export path');
  switch (command) {
    case 'help':
      console.log(help);
      break;
    case 'list':
      for (const e of catalog())
        console.log(`${e.id} v${e.version} [${e.variations.join(', ')}] — ${e.target}`);
      break;
    case 'start': {
      const attempt = start(
        ROOT,
        subject!,
        options.variation ?? 'base',
        mode(options.mode ?? 'independent'),
        (options.goal ?? 'maintain') as Attempt['goal'],
        options.id,
      );
      console.log(
        `Created ${attempt.id}\nRead .gym/${attempt.id}/workspace/README.md\nEdit .gym/${attempt.id}/workspace/starter/solution.ts\nnpm run gym -- check ${attempt.id}\nEdit .gym/${attempt.id}/review.json, then npm run gym -- record ${attempt.id}`,
      );
      if (attempt.mode === 'independent')
        console.log(
          'Close the agent and disable generative completion during this attempt. Documentation and debugger are allowed. Independence is self-reported.',
        );
      break;
    }
    case 'check': {
      const result = check(ROOT, subject!);
      console.log(result.output);
      console.log('Checks measure behavior, not understanding.');
      process.exitCode = result.passed ? 0 : 1;
      break;
    }
    case 'assist':
      assist(
        ROOT,
        subject!,
        mode(options.mode ?? 'coached'),
        options.hint ?? '',
        options.solution === 'true',
      );
      console.log('Assistance recorded; this session cannot be labeled independently solved.');
      break;
    case 'record':
      console.log(JSON.stringify(record(ROOT, subject!), null, 2));
      break;
    case 'due': {
      const items = due(ROOT);
      console.log(
        items.length
          ? items
              .map((e) => `${e.due ? 'DUE' : 'planned'} ${e.revisit} ${e.id} (${e.variation})`)
              .join('\n')
          : 'No scheduled revisits.',
      );
      break;
    }
    case 'history':
      console.log(JSON.stringify(all(ROOT), null, 2));
      break;
    case 'export':
      exportData(ROOT, subject!);
      console.log('Exported private records. Workspace code was not exported.');
      break;
    case 'delete':
      if (!options.yes) throw new Error('Deletion requires --yes; export first if needed');
      remove(ROOT, subject!);
      console.log('Deleted the selected attempt and its records.');
      break;
    default:
      throw new Error(`Unknown command: ${command}\n${help}`);
  }
} catch (error) {
  console.error(String(error));
  process.exitCode = 2;
}
