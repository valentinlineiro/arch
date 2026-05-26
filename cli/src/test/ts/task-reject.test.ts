import { test } from 'node:test';
import assert from 'node:assert';
import { RejectTask } from '../../main/ts/application/use-cases/task-reject.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockTaskRepository } from './mocks/index.js';

function makeReviewTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-050',
    title: 'Feature X',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.REVIEW,
    focus: FocusLevel.NONE,
    sprint: 'Focus:yes',
    class: '2-code-generation',
    cli: 'claude',
    context: ['src/'],
    content: '',
    filePath: '',
    lockedBy: 'cli',
    lockedAt: '2026-04-29T06:00:00Z',
    acceptanceCriteria: [{ description: 'AC1', completed: true }],
    rawMetaLine: '**Meta:** P1 | S | 7 | REVIEW | Focus:yes | 2-code-generation | claude | src/',
    ...overrides,
  } as Task;
}

test('RejectTask moves task from REVIEW to READY', async () => {
  const repo = new MockTaskRepository();
  repo.tasks = [makeReviewTask()];
  const useCase = new RejectTask(repo);

  await useCase.execute('TASK-050', 'Implementation does not match spec');

  const saved = repo.tasks.find(t => t.id === 'TASK-050');
  assert.strictEqual(saved?.status, TaskStatus.READY);
});

test('RejectTask clears lock on rejection', async () => {
  const repo = new MockTaskRepository();
  repo.tasks = [makeReviewTask()];
  const useCase = new RejectTask(repo);

  await useCase.execute('TASK-050', 'Needs rework');

  const saved = repo.tasks.find(t => t.id === 'TASK-050');
  assert.strictEqual(saved?.lockedBy, undefined);
  assert.strictEqual(saved?.lockedAt, undefined);
});

test('RejectTask records rejection reason and timestamp', async () => {
  const repo = new MockTaskRepository();
  repo.tasks = [makeReviewTask()];
  const useCase = new RejectTask(repo);

  await useCase.execute('TASK-050', 'Missing tests');

  const saved = repo.tasks.find(t => t.id === 'TASK-050');
  assert.ok(saved?.rejectedAt, 'rejectedAt must be set');
  assert.strictEqual(saved?.rejectionReason, 'Missing tests');
});

test('RejectTask throws when task not found', async () => {
  const repo = new MockTaskRepository();
  const useCase = new RejectTask(repo);

  await assert.rejects(() => useCase.execute('TASK-050', 'reason'), /not found/);
});

test('RejectTask throws when task is not in REVIEW', async () => {
  const repo = new MockTaskRepository();
  repo.tasks = [makeReviewTask({ status: TaskStatus.IN_PROGRESS })];
  const useCase = new RejectTask(repo);

  await assert.rejects(() => useCase.execute('TASK-050', 'reason'), /not in REVIEW/);
});
