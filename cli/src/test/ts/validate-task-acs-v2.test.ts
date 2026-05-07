import { test } from 'node:test';
import assert from 'node:assert';
import { ValidateTaskAcs } from '../../main/ts/application/use-cases/validate-task-acs.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
const validator = new ValidateTaskAcs(tmpDir);

test('ValidateTaskAcs - file: predicate passes if file exists', () => {
  const testFile = 'test-file.md';
  fs.writeFileSync(path.join(tmpDir, testFile), 'hello');
  
  const content = `- [ ] File exists → file: ${testFile}`;
  const result = validator.execute(content, 'TASK-205');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].type, 'file');
  assert.strictEqual(result.results[0].passed, true);
});

test('ValidateTaskAcs - file: predicate fails if file missing', () => {
  const content = '- [ ] Non-existent file → file: docs/NON_EXISTENT.md';
  const result = validator.execute(content, 'TASK-205');
  assert.strictEqual(result.results[0].passed, false);
});

test('ValidateTaskAcs - grep: predicate passes if pattern matches', () => {
  const testFile = 'grep-test.md';
  fs.writeFileSync(path.join(tmpDir, testFile), 'P-001: Register every violation');

  const content = `- [ ] Principles has P-001 → grep: "P-001" ${testFile}`;
  const result = validator.execute(content, 'TASK-205');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].type, 'grep');
  assert.strictEqual(result.results[0].passed, true);
});

test('ValidateTaskAcs - grep: predicate fails if pattern missing', () => {
  const testFile = 'grep-fail.md';
  fs.writeFileSync(path.join(tmpDir, testFile), 'nothing here');

  const content = `- [ ] Principles has INVALID → grep: "INVALID_PATTERN_XYZ" ${testFile}`;
  const result = validator.execute(content, 'TASK-205');
  assert.strictEqual(result.results[0].passed, false);
});

test('ValidateTaskAcs - prose: predicate is always SKIP', () => {
  const content = '- [ ] Manual verification → prose: verified manually';
  const result = validator.execute(content, 'TASK-205');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].type, 'prose');
  assert.strictEqual(result.results[0].passed, true);
});

test('ValidateTaskAcs - bare prose AC (no predicate) reports warning', () => {
  const content = '- [ ] I did this with no predicate';
  const result = validator.execute(content, 'TASK-205');
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].type, 'missing');
  assert.strictEqual(result.results[0].passed, false);
});

// Cleanup after tests
test('Cleanup', () => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
