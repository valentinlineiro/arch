import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskInProgress } from '../../main/ts/application/use-cases/mark-task-in-progress.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockFileSystem, MockTaskRepository } from './mocks/index.js';

function makeReadyTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-100',
    title: 'Test',
    priority: 'P2',
    size: 'XS',
    status: TaskStatus.READY,
    focus: FocusLevel.NONE,
    class: '2-code-generation',
    cli: 'claude',
    context: ['none'],
    content: '**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude | none\n- [ ] AC item',
    filePath: 'docs/tasks/TASK-100.md',
    acceptanceCriteria: [{ description: 'AC item', completed: false }],
    rawMetaLine: '**Meta:** P2 | XS | READY | Focus:no | 2-code-generation | claude | none',
    hansei: undefined,
    ...overrides,
  } as Task;
}

test('MarkTaskInProgress - pre-existence detection: all verifiable ACs pass', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = '{}';

  const task = makeReadyTask();
  const repo = new MockTaskRepository();
  repo.tasks = [task];
  
  // Mock validator that returns passing predicates
  const mockValidator: any = {
    execute: () => ({
      results: [
        { type: 'file', passed: true },
        { type: 'cmd', passed: true }
      ]
    })
  };
  
  const use = new MarkTaskInProgress(repo, undefined, undefined, '.', mockValidator);

  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (m: string) => logs.push(m);

  try {
    await use.execute('TASK-100', 'test-user');
    assert.ok(logs.some(l => l.includes('Pre-existence detected')), 'Warning should be emitted when all ACs pass');
  } finally {
    console.log = originalLog;
  }
});

test('MarkTaskInProgress - pre-existence detection: some ACs fail', async () => {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = '{}';

  const task = makeReadyTask();
  const repo = new MockTaskRepository();
  repo.tasks = [task];
  
  const mockValidator: any = {
    execute: () => ({
      results: [
        { type: 'file', passed: true },
        { type: 'cmd', passed: false }
      ]
    })
  };
  
  const use = new MarkTaskInProgress(repo, undefined, undefined, '.', mockValidator);

  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (m: string) => logs.push(m);

  try {
    await use.execute('TASK-100', 'test-user');
    assert.ok(!logs.some(l => l.includes('Pre-existence detected')), 'Warning should NOT be emitted when ACs fail');
  } finally {
    console.log = originalLog;
  }
});

test('MarkTaskInProgress - TASK-929: resolveActor reads config.strategies (not config.routing.strategies)', async () => {
  const fs = new MockFileSystem();
  // Config has strategies at top level — NOT under routing
  fs.files['arch.config.json'] = JSON.stringify({
    strategies: { '2-code-generation': 'claude-agent' },
    defaultActor: 'fallback-actor',
  });

  const task = makeReadyTask();
  const repo = new MockTaskRepository();
  repo.tasks = [task];
  repo.fileSystem = fs;
  const use = new MarkTaskInProgress(repo);

  await use.execute('TASK-100', 'test-user');

  const saved = repo.tasks.find(t => t.id === 'TASK-100');
  assert.strictEqual(saved?.actor, 'claude-agent', 'Actor should resolve from top-level config.strategies');
});

