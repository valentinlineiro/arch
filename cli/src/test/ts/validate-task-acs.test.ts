import { test } from 'node:test';
import assert from 'node:assert';
import { ValidateTaskAcs } from '../../main/ts/application/use-cases/validate-task-acs.js';

const validator = new ValidateTaskAcs(process.cwd());

test('ValidateTaskAcs - no predicates returns empty results and allPassed true', () => {
  const content = '- [x] Something was done\n- [ ] Another thing';
  const result = validator.execute(content, 'TASK-001');
  assert.strictEqual(result.taskId, 'TASK-001');
  assert.deepStrictEqual(result.results, []);
  assert.strictEqual(result.allPassed, true);
});

test('ValidateTaskAcs - passing predicate (exit 0)', () => {
  const content = '- [ ] Echo works  →  cmd: echo hello; exit: 0';
  const result = validator.execute(content, 'TASK-001');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].passed, true);
  assert.strictEqual(result.results[0].expectedExit, 0);
  assert.strictEqual(result.results[0].actualExit, 0);
  assert.strictEqual(result.allPassed, true);
});

test('ValidateTaskAcs - failing predicate (exit mismatch)', () => {
  const content = '- [ ] Command fails  →  cmd: exit 1; exit: 0';
  const result = validator.execute(content, 'TASK-001');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].passed, false);
  assert.strictEqual(result.results[0].expectedExit, 0);
  assert.strictEqual(result.results[0].actualExit, 1);
  assert.strictEqual(result.allPassed, false);
});

test('ValidateTaskAcs - intentional non-zero expected exit', () => {
  const content = '- [ ] File missing  →  cmd: test -f /nonexistent_file_xyz; exit: 1';
  const result = validator.execute(content, 'TASK-001');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].passed, true);
});

test('ValidateTaskAcs - mixed predicates reports all results', () => {
  const content = [
    '- [ ] Passes  →  cmd: true; exit: 0',
    '- [ ] Fails   →  cmd: false; exit: 0',
    '- [ ] Prose AC with no predicate',
  ].join('\n');
  const result = validator.execute(content, 'TASK-001');
  assert.strictEqual(result.results.length, 2);
  assert.strictEqual(result.results[0].passed, true);
  assert.strictEqual(result.results[1].passed, false);
  assert.strictEqual(result.allPassed, false);
});

test('ValidateTaskAcs - extracts AC description correctly', () => {
  const content = '- [ ] arch review passes  →  cmd: echo ok; exit: 0';
  const result = validator.execute(content, 'TASK-001');
  assert.ok(result.results[0].ac.includes('arch review passes'));
});

test('ValidateTaskAcs - timeout produces distinct timedOut result', () => {
  const shortTimeoutValidator = new ValidateTaskAcs(process.cwd(), 100);
  const content = '- [ ] Slow command  →  cmd: sleep 5; exit: 0';
  const result = shortTimeoutValidator.execute(content, 'TASK-001');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].timedOut, true);
  assert.strictEqual(result.results[0].passed, false);
  assert.strictEqual(result.allPassed, false);
});
