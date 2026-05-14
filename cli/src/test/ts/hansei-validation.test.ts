import { test } from 'node:test';
import assert from 'node:assert';
import { TaskValidator } from '../../main/ts/domain/services/task-validator.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';

const baseTask: Task = {
  id: 'TASK-001',
  title: 'Test Task',
  priority: 'P1',
  size: 'M',
  status: TaskStatus.READY,
  focus: false,
  sprint: '',
  class: 'test',
  cli: 'local',
  context: ['test.ts'],
  content: '',
  filePath: 'docs/tasks/TASK-001.md'
};

test('TaskValidator - validateHansei - missing Hansei for M+ task', () => {
  const errors = TaskValidator.validateHansei({ ...baseTask, size: 'M' });
  assert.ok(errors.some(e => e.includes('Missing Hansei section')), 'Should require Hansei for M+ task');
});

test('TaskValidator - validateHansei - missing Hansei for S task (optional)', () => {
  const errors = TaskValidator.validateHansei({ ...baseTask, size: 'S' });
  assert.strictEqual(errors.length, 0, 'Should NOT require Hansei for S task in READY');
});

test('TaskValidator - validateHansei - missing Hansei for S task in REVIEW', () => {
  const errors = TaskValidator.validateHansei({ ...baseTask, size: 'S', status: TaskStatus.REVIEW });
  assert.ok(errors.some(e => e.includes('Missing Hansei section')), 'Should require Hansei for any task in REVIEW');
});

test('TaskValidator - validateHansei - valid H1 Hansei', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H1',
      category: '[TypeHack]',
      decision: 'Used any to bypass complex type circular dependency.',
      constraint: 'P1 deadline and type complexity.',
      cost: 'Minor type safety degradation in one module.',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.strictEqual(errors.length, 0, `Should be valid, but got: ${errors.join(', ')}`);
});

test('TaskValidator - validateHansei - invalid category', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H1',
      category: '[InvalidCategory]',
      decision: 'Valid decision',
      constraint: 'Valid constraint',
      cost: 'Valid cost',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('Invalid Hansei Category')), 'Should detect invalid category');
});

test('TaskValidator - validateHansei - H2 evidence requirement', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H2',
      category: '[ContextWaste]',
      decision: 'Valid decision',
      constraint: 'Valid constraint',
      cost: 'Valid cost',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('H2 requires evidence')), 'Should detect missing evidence for H2');
  
  // With evidence
  task.hansei!.forwardAction = 'Link to TASK-123';
  const errorsWithEvidence = TaskValidator.validateHansei(task);
  assert.strictEqual(errorsWithEvidence.length, 0, 'Should be valid with TASK link in Forward Action');
});

test('TaskValidator - validateHansei - H3b requirements', () => {
  const task: Task = {
    ...baseTask,
    hansei: {
      severity: 'H3b',
      category: '[ProvenanceBreak]',
      decision: 'Valid decision',
      constraint: 'Valid constraint',
      cost: 'Valid cost',
      forwardAction: 'none'
    }
  };
  const errors = TaskValidator.validateHansei(task);
  assert.ok(errors.some(e => e.includes('H3b requires an Expiry Task')), 'Should detect missing expiry task');
  assert.ok(errors.some(e => e.includes('H3b requires an Owner')), 'Should detect missing owner');
  
  // Fixed
  task.hansei!.decision = 'Owner: Architect. Temporary provenance bypass.';
  task.hansei!.forwardAction = 'Expires on TASK-444';
  const errorsFixed = TaskValidator.validateHansei(task);
  assert.strictEqual(errorsFixed.length, 0, 'Should be valid with Owner and Expiry Task');
});
