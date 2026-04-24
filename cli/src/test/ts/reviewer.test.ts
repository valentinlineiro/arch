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
});

test('Reviewer - reviewTask (AC completion)', () => {
  const reviewer = new Reviewer();
  
  const taskDoneWithPendingAC = {
    id: 'TASK-001',
    title: 'Test',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.DONE,
    sprint: 'Sprint 1',
    class: 'test',
    cli: 'claude',
    context: [],
    acceptanceCriteria: [
      { description: 'AC1', completed: true },
      { description: 'AC2', completed: false }
    ]
  };
  
  const result = reviewer.reviewTask(taskDoneWithPendingAC);
  assert.strictEqual(result.valid, false);
  assert.ok(result.violations[0].includes('pending Acceptance Criteria'));
});
