import { test } from 'node:test';
import assert from 'node:assert';
import { RejectTask } from '../../main/ts/application/use-cases/task-reject.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';

class MockTaskRepository {
  saved: Task | null = null;
  private task: Task | null;
  constructor(task: Task | null) { this.task = task; }
  async getById(id: string) { return this.task?.id === id ? this.task : null; }
  async getAll() { return this.task ? [this.task] : []; }
  async getActive() { return this.task ? [this.task] : []; }
  async save(task: Task) { this.saved = task; }
  async findReady() { return []; }
  async getNextId() { return 'TASK-999'; }
}

function makeReviewTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-050',
    title: 'Feature X',
    priority: 'P1',
    size: 'S',
    value: 7,
    status: TaskStatus.REVIEW,
    sprint: 'Focus:yes',
    class: '2-code-generation',
    cli: 'claude',
    context: ['src/'],
    lockedBy: 'cli',
    lockedAt: '2026-04-29T06:00:00Z',
    acceptanceCriteria: [{ description: 'AC1', completed: true }],
    rawMetaLine: '**Meta:** P1 | S | 7 | REVIEW | Focus:yes | 2-code-generation | claude | src/',
    ...overrides,
  };
}

test('RejectTask moves task from REVIEW to READY', async () => {
  const repo = new MockTaskRepository(makeReviewTask());
  const useCase = new RejectTask(repo as any);

  await useCase.execute('TASK-050', 'Implementation does not match spec');

  assert.strictEqual(repo.saved?.status, TaskStatus.READY);
});

test('RejectTask clears lock on rejection', async () => {
  const repo = new MockTaskRepository(makeReviewTask());
  const useCase = new RejectTask(repo as any);

  await useCase.execute('TASK-050', 'Needs rework');

  assert.strictEqual(repo.saved?.lockedBy, undefined);
  assert.strictEqual(repo.saved?.lockedAt, undefined);
});

test('RejectTask records rejection reason and timestamp', async () => {
  const repo = new MockTaskRepository(makeReviewTask());
  const useCase = new RejectTask(repo as any);

  await useCase.execute('TASK-050', 'Missing tests');

  assert.ok(repo.saved?.rejectedAt, 'rejectedAt must be set');
  assert.strictEqual(repo.saved?.rejectionReason, 'Missing tests');
});

test('RejectTask throws when task not found', async () => {
  const repo = new MockTaskRepository(null);
  const useCase = new RejectTask(repo as any);

  await assert.rejects(() => useCase.execute('TASK-050', 'reason'), /not found/);
});

test('RejectTask throws when task is not in REVIEW', async () => {
  const repo = new MockTaskRepository(makeReviewTask({ status: TaskStatus.IN_PROGRESS }));
  const useCase = new RejectTask(repo as any);

  await assert.rejects(() => useCase.execute('TASK-050', 'reason'), /not in REVIEW/);
});
