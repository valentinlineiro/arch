import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';

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

test('MarkTaskDone - sets status to DONE', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo);

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - throws when task not found', async () => {
  const repo = new MockTaskRepository(null);
  const useCase = new MarkTaskDone(repo);

  await assert.rejects(
    () => useCase.execute('TASK-999'),
    /TASK-999 not found/
  );
});

test('MarkTaskDone - works from REVIEW status', async () => {
  const task = makeTask({ status: TaskStatus.REVIEW });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo);

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});
