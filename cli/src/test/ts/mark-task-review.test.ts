import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskReview } from '../../main/ts/application/use-cases/mark-task-review.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-031',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    focus: true,
    sprint: '',
    class: '2-code-generation',
    cli: 'claude-code',
    context: [],
    content: '- [x] Prose AC with no predicate\n',
    filePath: '/tmp/TASK-031.md',
    rawMetaLine: '',
    ...overrides,
  };
}

class MockTaskRepository implements TaskRepository {
  saved: Task | null = null;
  private task: Task | null;

  constructor(task: Task | null) { this.task = task; }
  async getById(id: string) { return this.task?.id === id ? this.task : null; }
  async getAll() { return this.task ? [this.task] : []; }
  async getActive() { return this.task ? [this.task] : []; }
  async findReady() { return []; }
  async getNextId() { return 'TASK-001'; }
  async save(task: Task) { this.saved = task; }
}

test('MarkTaskReview - throws when task not found', async () => {
  const repo = new MockTaskRepository(null);
  const useCase = new MarkTaskReview(repo, process.cwd());

  await assert.rejects(
    () => useCase.execute('TASK-999'),
    /TASK-999 not found/
  );
});

test('MarkTaskReview - throws when task is not IN_PROGRESS', async () => {
  const task = makeTask({ status: TaskStatus.READY });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  await assert.rejects(
    () => useCase.execute('TASK-031'),
    /not in IN_PROGRESS state/
  );
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskReview - blocks transition when predicate fails', async () => {
  const task = makeTask({
    content: '- [x] Command fails  →  cmd: false; exit: 0\n',
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  const result = await useCase.execute('TASK-031');

  assert.strictEqual(result.passed, false);
  assert.strictEqual(result.failures.length, 1);
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskReview - sets status to REVIEW when all predicates pass', async () => {
  const task = makeTask({
    content: '- [x] Command passes  →  cmd: true; exit: 0\n',
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  const result = await useCase.execute('TASK-031');

  assert.strictEqual(result.passed, true);
  assert.strictEqual(repo.saved?.status, TaskStatus.REVIEW);
  assert.strictEqual(repo.saved?.focus, false);
});

test('MarkTaskReview - sets status to REVIEW when no predicates present', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  const result = await useCase.execute('TASK-031');

  assert.strictEqual(result.passed, true);
  assert.strictEqual(repo.saved?.status, TaskStatus.REVIEW);
  assert.strictEqual(repo.saved?.focus, false);
});
