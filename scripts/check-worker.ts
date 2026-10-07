import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { AssertionError } from 'node:assert';
const module = await import(pathToFileURL(resolve(process.argv[2], 'checks.ts')).href);
if (!Array.isArray(module.cases) || module.cases.length === 0)
  throw new Error('No acceptance cases');
const results: { name: string; passed: boolean; assertion?: boolean; error?: string }[] = [];
for (const entry of module.cases) {
  try {
    await entry.run();
    results.push({ name: entry.name, passed: true });
  } catch (error) {
    results.push({
      name: entry.name,
      passed: false,
      assertion: error instanceof AssertionError,
      error: String(error),
    });
  }
}
console.log(JSON.stringify(results));
process.exitCode = results.every((result) => result.passed) ? 0 : 1;
