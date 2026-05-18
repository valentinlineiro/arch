import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskInProgress } from '../../main/ts/application/use-cases/mark-task-in-progress.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';
import { MockFileSystem } from './mocks/index.js';

class MockTaskRepository implements TaskRepository {
  saved: Task | null = null;
  private task: Task;
  fileSystem: MockFileSystem;

  constructor(task: Task, fs: MockFileSystem) {
    this.task = task;
    this.fileSystem = fs;
  }

  async getById(id: string) { return this.task.id === id ? this.task : null; }
  async getAll() { return [this.task]; }
  async getActive() { return [this.task]; }
  async findReady() { return [this.task]; }
  async getNextId() { return 'TASK-999'; }
  async save(task: Task) { this.saved = task; }
}

function makeReadyTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-100',
    title: 'Test',
    priority: 'P2',
    size: 'XS',
    status: TaskStatus.READY,
    class: '2-code-generation',
    cli: 'claude',
    context: ['none'],
    content: '**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude | none\n- [ ] AC item',
    acceptanceCriteria: [{ description: 'AC item' }],
    rawMetaLine: '**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude | none',
    hansei: null as any,
    ...overrides,
  };
}

test('MarkTaskInProgress - TASK-929: resolveActor reads config.strategies (not config.routing.strategies)', async () => {
  const fs = new MockFileSystem();
  // Config has strategies at top level — NOT under routing
  fs.files['arch.config.json'] = JSON.stringify({
    strategies: { '2-code-generation': 'claude-agent' },
    defaultActor: 'fallback-actor',
  });

  const task = makeReadyTask();
  const repo = new MockTaskRepository(task, fs);
  const use = new MarkTaskInProgress(repo);

  await use.execute('TASK-100', 'test-user');

  assert.strictEqual(repo.saved?.actor, 'claude-agent', 'Actor should resolve from top-level config.strategies');
});
