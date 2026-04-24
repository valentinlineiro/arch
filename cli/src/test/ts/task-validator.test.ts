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
  const validMeta = '**Meta:** P0 | S | READY | Sprint 1 | 2-code-generation | claude | README.md';
  const invalidMeta = '**Meta:** P9 | S | READY | Sprint 1 | 2-code-generation | claude | README.md';
  
  assert.strictEqual(TaskValidator.isValidMeta(validMeta), true);
  assert.strictEqual(TaskValidator.isValidMeta(invalidMeta), false);
});

test('TaskValidator - parseMeta', () => {
  const meta = '**Meta:** P1 | M | IN_PROGRESS | Sprint 1 | 6-writing | claude | agents/EXEC.md';
  const parsed = TaskValidator.parseMeta(meta);
  
  assert.strictEqual(parsed.priority, '1');
  assert.strictEqual(parsed.size, 'M');
  assert.strictEqual(parsed.status, 'IN_PROGRESS');
  assert.strictEqual(parsed.sprint, 'Sprint 1');
  assert.strictEqual(parsed.class, '6-writing');
  assert.strictEqual(parsed.cli, 'claude');
  assert.strictEqual(parsed.context, 'agents/EXEC.md');
});
