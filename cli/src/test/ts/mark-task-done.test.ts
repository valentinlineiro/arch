import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';
import { Reviewer, ReviewResult } from '../../main/ts/domain/services/reviewer.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-031',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    sprint: 'Sprint 3',
    class: '2-code-generation',
    cli: 'claude-code',
    context: ['src/'],
    acceptanceCriteria: [],
    rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Sprint 3 | 2-code-generation | claude-code | src/',
    ...overrides,
  };
}

class MockTaskRepository implements TaskRepository {
  saved: Task | null = null;
  private task: Task | null;

  constructor(task: Task | null) {
    this.task = task;
  }

  async getById(id: string) { return this.task?.id === id ? this.task : null; }
  async getAll() { return this.task ? [this.task] : []; }
  async findReady() { return []; }
  async save(task: Task) { this.saved = task; }
}

function makeReviewer(result: ReviewResult): Reviewer {
  const reviewer = new Reviewer();
  reviewer.reviewTask = () => result;
  return reviewer;
}

test('MarkTaskDone - sets status to DONE', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }));

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - throws when task not found', async () => {
  const repo = new MockTaskRepository(null);
  const useCase = new MarkTaskDone(repo, new Reviewer());

  await assert.rejects(
    () => useCase.execute('TASK-999'),
    /TASK-999 not found/
  );
});

test('MarkTaskDone - works from REVIEW status', async () => {
  const task = makeTask({ status: TaskStatus.REVIEW });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }));

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - blocks transition when pending ACs exist', async () => {
  const task = makeTask({
    acceptanceCriteria: [
      { description: 'AC one', completed: true },
      { description: 'AC two', completed: false },
    ],
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, new Reviewer());

  await assert.rejects(
    () => useCase.execute('TASK-031'),
    /Cannot mark TASK-031 as DONE/
  );
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskDone - force bypasses pending AC guard', async () => {
  const task = makeTask({
    acceptanceCriteria: [
      { description: 'AC one', completed: false },
    ],
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, new Reviewer());

  await useCase.execute('TASK-031', true);

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - injects closedAt timestamp on DONE transition', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }));

  await useCase.execute('TASK-031');

  assert.ok(repo.saved?.closedAt, 'closedAt should be set');
  assert.ok(!isNaN(Date.parse(repo.saved!.closedAt!)), 'closedAt should be a valid ISO date');
});

test('MarkTaskDone - does not overwrite existing closedAt (idempotent)', async () => {
  const existing = '2026-01-01T00:00:00.000Z';
  const task = makeTask({ closedAt: existing });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }));

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.closedAt, existing);
});

test('MarkTaskDone - force path also injects closedAt', async () => {
  const task = makeTask({ acceptanceCriteria: [{ description: 'AC', completed: false }] });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, new Reviewer());

  await useCase.execute('TASK-031', true);

  assert.ok(repo.saved?.closedAt, 'closedAt should be set even on force');
});
