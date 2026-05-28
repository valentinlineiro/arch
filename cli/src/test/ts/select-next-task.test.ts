import { test } from 'node:test';
import assert from 'node:assert';
import { SelectNextTask } from '../../main/ts/application/use-cases/select-next-task.js';
import { NextCommand } from '../../main/ts/application/commands/next-command.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockFileSystem, MockTaskRepository } from './mocks/index.js';
// ...
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-001',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.READY,
    focus: FocusLevel.NONE,
    sprint: 'Sprint 1',
    class: '2-code-generation',
    cli: 'claude-code',
    context: [],
    acceptanceCriteria: [],
    content: '# TASK-001\nTest content',
    filePath: 'docs/tasks/TASK-001.md',
    ...overrides,
  };
}

function makeRepo(...tasks: Task[]): MockTaskRepository {
  const repo = new MockTaskRepository();
  repo.tasks.push(...tasks);
  return repo;
}

test('returns no_ready_tasks halt when no READY tasks exist', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS }),
    makeTask({ id: 'TASK-002', status: TaskStatus.DONE }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.halt.kind === 'no_ready_tasks');
});

test('returns the single READY task', async () => {
  const task = makeTask({ id: 'TASK-005', status: TaskStatus.READY, content: '# TASK-005\nContent' });
  const repo = makeRepo(task);
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.equal(result.ok, true);
  assert.ok(result.ok && result.task.id === 'TASK-005');
});

test('sorts by priority: P0 wins over P1', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-010', priority: 'P1', status: TaskStatus.READY }),
    makeTask({ id: 'TASK-011', priority: 'P0', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-011');
});

test('sorts by TASK-ID numerically when priority is equal', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-020', priority: 'P1', status: TaskStatus.READY }),
    makeTask({ id: 'TASK-005', priority: 'P1', status: TaskStatus.READY }),
    makeTask({ id: 'TASK-012', priority: 'P1', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-005');
});

test('Focus:yes wins over higher priority non-focused task', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', priority: 'P0', status: TaskStatus.READY, focus: FocusLevel.NONE }),
    makeTask({ id: 'TASK-002', priority: 'P2', status: TaskStatus.READY, focus: FocusLevel.HIGH }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('filters out blocked tasks (dependency not DONE)', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.READY, depends: ['TASK-099'] }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
    makeTask({ id: 'TASK-099', status: TaskStatus.IN_PROGRESS }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('does not filter out task whose dependency is DONE', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.READY, depends: ['TASK-099'] }),
    makeTask({ id: 'TASK-099', status: TaskStatus.DONE }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-001');
});

test('returns winner_blocked halt when all ready tasks are blocked', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.READY, depends: ['TASK-099'] }),
    makeTask({ id: 'TASK-099', status: TaskStatus.IN_PROGRESS }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.halt.kind === 'winner_blocked');
  assert.ok(!result.ok && result.halt.kind === 'winner_blocked' && result.halt.taskId === 'TASK-001');
});

test('depends: none means no dependencies', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.READY, depends: ['none'] }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-001');
});

test('returns stale_lock halt when P0 IN_PROGRESS task locked > 3 days', async () => {
  const oldDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, priority: 'P0', lockedAt: oldDate }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.halt.kind === 'stale_lock');
  assert.ok(!result.ok && result.halt.kind === 'stale_lock' && result.halt.taskId === 'TASK-001');
});

test('does not return stale_lock for P0 IN_PROGRESS locked < 3 days', async () => {
  const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, priority: 'P0', lockedAt: recentDate }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('does not return stale_lock for P1 IN_PROGRESS even if stale', async () => {
  const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, priority: 'P1', lockedAt: oldDate }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('P0 IN_PROGRESS with lockedAt undefined does not trigger stale-lock halt', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, priority: 'P0', lockedAt: undefined }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('returns budget_exceeded halt when IN_PROGRESS task exceeds turns threshold', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, size: 'S', steps: 20 }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const muriConfig = { S: { turns: 15, cost: 0.15 } };
  const useCase = new SelectNextTask(repo, muriConfig);
  const result = await useCase.execute();
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.halt.kind === 'budget_exceeded');
  assert.ok(!result.ok && result.halt.kind === 'budget_exceeded' && result.halt.taskId === 'TASK-001');
  assert.ok(!result.ok && result.halt.kind === 'budget_exceeded' && result.halt.type === 'turns');
});

test('returns budget_exceeded halt when IN_PROGRESS task exceeds cost threshold', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, size: 'M', cost: 0.75 }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const muriConfig = { M: { turns: 40, cost: 0.50 } };
  const useCase = new SelectNextTask(repo, muriConfig);
  const result = await useCase.execute();
  assert.equal(result.ok, false);
  assert.ok(!result.ok && result.halt.kind === 'budget_exceeded');
  assert.ok(!result.ok && result.halt.kind === 'budget_exceeded' && result.halt.type === 'cost');
});

test('does not halt when IN_PROGRESS task is within budget', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, size: 'S', steps: 5, cost: 0.05 }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const muriConfig = { S: { turns: 15, cost: 0.15 } };
  const useCase = new SelectNextTask(repo, muriConfig);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('does not check budget when muriConfig is not provided', async () => {
  const repo = makeRepo(
    makeTask({ id: 'TASK-001', status: TaskStatus.IN_PROGRESS, size: 'S', steps: 999, cost: 999 }),
    makeTask({ id: 'TASK-002', status: TaskStatus.READY }),
  );
  const useCase = new SelectNextTask(repo);
  const result = await useCase.execute();
  assert.ok(result.ok && result.task.id === 'TASK-002');
});

test('NextCommand outputs valid JSON when --json flag is passed', async () => {
  const task = makeTask({
    id: 'TASK-100',
    status: TaskStatus.READY,
    content: '# TASK-100\nTest JSON output',
    filePath: 'docs/tasks/TASK-100.md',
  });
  const repo = makeRepo(task);
  const command = new NextCommand(repo, ['--json']);

  let output = '';
  const originalLog = console.log;
  console.log = (message: string) => {
    output = message;
  };

  try {
    await command.execute();
    const parsed = JSON.parse(output);
    assert.equal(parsed.taskId, 'TASK-100');
    assert.equal(parsed.filePath, 'docs/tasks/TASK-100.md');
    assert.equal(parsed.content, '# TASK-100\nTest JSON output');
  } finally {
    console.log = originalLog;
  }
});

test('NextCommand - TASK-930: does not read docs/INBOX.md for freshness check', async () => {
  const task = makeTask({ id: 'TASK-200', status: TaskStatus.READY, content: '# TASK-200', filePath: 'docs/tasks/TASK-200.md' });
  const repo = makeRepo(task);

  const reads: string[] = [];
  const spyFs = new MockFileSystem();
  spyFs.readFile = async (path: string) => {
    reads.push(path);
    throw new Error(`File not found: ${path}`);
  };

  const command = new NextCommand(repo, [], undefined, spyFs as any, '/repo');

  const originalLog = console.log;
  console.log = () => {};
  try {
    await command.execute();
  } finally {
    console.log = originalLog;
  }

  assert.ok(
    !reads.some(p => p.includes('INBOX')),
    `NextCommand must not read INBOX.md — reads were: ${reads.join(', ')}`
  );
});
