import { test } from 'node:test';
import assert from 'node:assert';
import { Reviewer } from '../../main/ts/domain/services/reviewer.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

test('Reviewer - validateCommitMessage', () => {
  const reviewer = new Reviewer();
  
  const valid = reviewer.validateCommitMessage('feat: add reviewer engine [TASK-012]');
  assert.strictEqual(valid.valid, true);
  
  const noPrefix = reviewer.validateCommitMessage('add reviewer engine [TASK-012]');
  assert.strictEqual(noPrefix.valid, false);
  assert.ok(noPrefix.violations.some(v => v.includes('Commit message must start with')));
  
  const noId = reviewer.validateCommitMessage('feat: add reviewer engine');
  assert.strictEqual(noId.valid, false);
  assert.ok(noId.violations.some(v => v.includes('must reference a TASK-ID')));

  const multiIdSpace = reviewer.validateCommitMessage('feat: [TASK-001] [TASK-002]');
  assert.strictEqual(multiIdSpace.valid, true);

  const multiIdComma = reviewer.validateCommitMessage('feat: [TASK-001], [TASK-002]');
  assert.strictEqual(multiIdComma.valid, true);

  const taskPrefix = reviewer.validateCommitMessage('task: update something');
  assert.strictEqual(taskPrefix.valid, true);

  const ideaPrefix = reviewer.validateCommitMessage('idea: new concept');
  assert.strictEqual(ideaPrefix.valid, true);
});

test('Reviewer - reviewTask (AC completion)', () => {
  const reviewer = new Reviewer();

  for (const status of [TaskStatus.DONE, TaskStatus.REVIEW]) {
    const taskWithPendingAC = {
      id: 'TASK-001',
      title: 'Test',
      priority: 'P1',
      size: 'S',
      status,
      sprint: 'Sprint 1',
      class: 'test',
      cli: 'claude',
      context: [],
      acceptanceCriteria: [
        { description: 'AC1', completed: true },
        { description: 'AC2', completed: false }
      ]
    };

    const result = reviewer.reviewTask(taskWithPendingAC);
    assert.strictEqual(result.valid, false);
    assert.ok(result.violations[0].includes(`marked as ${status}`));
    assert.ok(result.violations[0].includes('pending Acceptance Criteria'));
  }
});

test('Reviewer - reviewTask ignores pending ACs outside DONE/REVIEW', () => {
  const reviewer = new Reviewer();

  const readyTaskWithPendingAC = {
    id: 'TASK-001',
    title: 'Test',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.READY,
    sprint: 'Sprint 1',
    class: 'test',
    cli: 'claude',
    context: [],
    acceptanceCriteria: [
      { description: 'AC1', completed: false }
    ]
  };

  const result = reviewer.reviewTask(readyTaskWithPendingAC);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.violations, []);
});

test('Reviewer - reviewTask allows REVIEW with all ACs completed', () => {
  const reviewer = new Reviewer();
  
  const taskReviewWithAllACs = {
    id: 'TASK-001',
    title: 'Test',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.REVIEW,
    sprint: 'Sprint 1',
    class: 'test',
    cli: 'claude',
    context: [],
    acceptanceCriteria: [
      { description: 'AC1', completed: true },
      { description: 'AC2', completed: true }
    ]
  };
  
  const result = reviewer.reviewTask(taskReviewWithAllACs);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.violations, []);
});
