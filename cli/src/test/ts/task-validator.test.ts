import { test } from 'node:test';
import assert from 'node:assert';
import { TaskValidator } from '../../main/ts/domain/services/task-validator.js';

test('TaskValidator - isValidHeader', () => {
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-001: Title'), true);
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-123: Multiple words in title'), true);
  assert.strictEqual(TaskValidator.isValidHeader('## INVALID-001: Title'), false);
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-01: Too short'), false);
});

test('TaskValidator - isValidMeta', () => {
  const validMeta = '**Meta:** P0 | S | 5 | READY | Focus:no | 2-code-generation | claude | README.md';
  const invalidMeta = '**Meta:** P9 | S | 5 | READY | Focus:no | 2-code-generation | claude | README.md';
  const backlogMeta = '**Meta:** P1 | XS | 7 | BACKLOG | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/task-reject.ts';

  assert.strictEqual(TaskValidator.isValidMeta(validMeta), true);
  assert.strictEqual(TaskValidator.isValidMeta(invalidMeta), false);
  assert.strictEqual(TaskValidator.isValidMeta(backlogMeta), true, 'BACKLOG is a valid status');
});

test('TaskValidator - isValidDepends', () => {
  assert.strictEqual(TaskValidator.isValidDepends('**Depends:** TASK-001'), true);
  assert.strictEqual(TaskValidator.isValidDepends('**Depends:** TASK-001, TASK-002'), true);
  assert.strictEqual(TaskValidator.isValidDepends('**Depends:** TASK-001, TASK-002, TASK-003'), true);
  assert.strictEqual(TaskValidator.isValidDepends('**Depends:** invalid'), false);
  assert.strictEqual(TaskValidator.isValidDepends('Depends: TASK-001'), false);
});

test('TaskValidator - parseMeta', () => {
  const meta = '**Meta:** P1 | M | 8 | IN_PROGRESS | Focus:yes | 6-writing | claude | agents/EXEC.md';
  const parsed = TaskValidator.parseMeta(meta);
  
  assert.strictEqual(parsed.priority, '1');
  assert.strictEqual(parsed.size, 'M');
  assert.strictEqual(parsed.value, '8');
  assert.strictEqual(parsed.status, 'IN_PROGRESS');
  assert.strictEqual(parsed.focus, 'Focus:yes');
  assert.strictEqual(parsed.class, '6-writing');
  assert.strictEqual(parsed.cli, 'claude');
  assert.strictEqual(parsed.context, 'agents/EXEC.md');
});
