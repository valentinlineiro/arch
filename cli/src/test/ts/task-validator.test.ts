import { test } from 'node:test';
import assert from 'node:assert';
import { TaskValidator } from '../../main/ts/domain/services/task-validator.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-999',
    title: 'Test',
    priority: 'P1',
    size: 'M',
    status: TaskStatus.REVIEW,
    focus: FocusLevel.NONE,
    sprint: '',
    class: '2-code-generation',
    cli: 'claude',
    context: [],
    acceptanceCriteria: [],
    ...overrides,
  };
}

test('TaskValidator - isValidHeader', () => {
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-001: Title'), true);
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-123: Multiple words in title'), true);
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-1010: Four digit ID'), true);
  assert.strictEqual(TaskValidator.isValidHeader('## INVALID-001: Title'), false);
  assert.strictEqual(TaskValidator.isValidHeader('## TASK-01: Too short'), false);
});

test('TaskValidator - isValidMeta', () => {
  const validMeta = '**Meta:** P0 | S | READY | Focus:no | 2-code-generation | claude | README.md';
  const invalidMeta = '**Meta:** P9 | S | READY | Focus:no | 2-code-generation | claude | README.md';
  const backlogMeta = '**Meta:** P1 | XS | BACKLOG | Focus:no | 7-operations | local | cli/src/main/ts/application/use-cases/task-reject.ts';

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

test('TaskValidator - validateMeta', () => {
  const meta = '**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 6-writing | claude | agents/EXEC.md';
  const errors = TaskValidator.validateMeta(meta);
  
  assert.strictEqual(errors.length, 0, `Should have no errors, but got: ${errors.join(', ')}`);
});

test('TaskValidator - validateMeta failures', () => {
  const meta = '**Meta:** P1 | INVALID | IN_PROGRESS | Focus:yes | 6-writing | claude | agents/EXEC.md';
  const errors = TaskValidator.validateMeta(meta);

  assert.ok(errors.some(e => e.includes('Invalid Size')), 'Should detect invalid size');
});

// ── TASK-934: Tiered obligations ────────────────────────────────────────────

test('TaskValidator - TASK-934: XS task at REVIEW with no Hansei produces no error', () => {
  const task = makeTask({ size: 'XS', status: TaskStatus.REVIEW, hansei: undefined });
  const errors = TaskValidator.validateHansei(task);
  assert.strictEqual(errors.length, 0, 'XS task at REVIEW must not require Hansei');
});

test('TaskValidator - TASK-934: S task at DONE with no Hansei produces no error', () => {
  const task = makeTask({ size: 'S', status: TaskStatus.DONE, hansei: undefined });
  const errors = TaskValidator.validateHansei(task);
  assert.strictEqual(errors.length, 0, 'S task at DONE must not require Hansei');
});

test('TaskValidator - TASK-934: M task at REVIEW with no Hansei produces error', () => {
  const task = makeTask({ size: 'M', status: TaskStatus.REVIEW, hansei: undefined });
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.length > 0, 'M task at REVIEW must still require Hansei');
});

test('TaskValidator - TASK-934: XS task with Hansei present is still validated for correctness', () => {
  const task = makeTask({
    size: 'XS',
    status: TaskStatus.DONE,
    hansei: { severity: 'INVALID' as any, category: '[SpecDrift]', decision: 'done properly here.', constraint: 'none found at all.', cost: 'zero cost incurred.', forwardAction: 'nothing more needed.' },
  });
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('Severity')), 'Hansei present on XS task must still be validated');
});
