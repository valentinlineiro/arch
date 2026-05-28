import { test } from 'node:test';
import assert from 'node:assert';
import { SelectNextTask } from '../../main/ts/application/use-cases/select-next-task.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockTaskRepository } from './mocks/index.js';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-001',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.READY,
    focus: FocusLevel.NONE,
    sprint: '',
    class: '2-code-generation',
    cli: 'claude-code',
    context: [],
    acceptanceCriteria: [],
    content: '# TASK-001\nTest content',
    filePath: 'docs/tasks/TASK-001.md',
    ...overrides,
  };
}

test('SelectNextTask with sprintSlug filters to sprint tasks only', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push(
    makeTask({ id: 'TASK-001', priority: 'P0', status: TaskStatus.READY, sprint: '' }),
    makeTask({ id: 'TASK-002', priority: 'P2', status: TaskStatus.READY, sprint: 'sprint/alpha' }),
    makeTask({ id: 'TASK-003', priority: 'P1', status: TaskStatus.READY, sprint: 'sprint/alpha' }),
  );
  const selector = new SelectNextTask(repo);

  const result = await selector.execute({ sprintSlug: 'alpha' });

  assert.ok(result.ok, 'Should find a task');
  assert.ok(result.ok && result.task.id === 'TASK-003', `Expected TASK-003 (P1 in sprint), got ${result.ok ? result.task.id : 'halt'}`);
});

test('SelectNextTask with sprintSlug returns no_ready_tasks when no sprint tasks exist', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push(makeTask({ id: 'TASK-001', priority: 'P0', status: TaskStatus.READY, sprint: '' }));
  const selector = new SelectNextTask(repo);

  const result = await selector.execute({ sprintSlug: 'alpha' });

  assert.ok(!result.ok, 'Should halt');
  assert.ok(!result.ok && result.halt.kind === 'no_ready_tasks');
});

test('SelectNextTask with sprintSlug accepts sprint/ prefix or bare slug', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push(makeTask({ id: 'TASK-010', priority: 'P1', status: TaskStatus.READY, sprint: 'sprint/beta' }));
  const selector = new SelectNextTask(repo);

  const withPrefix = await selector.execute({ sprintSlug: 'sprint/beta' });
  assert.ok(withPrefix.ok && withPrefix.task.id === 'TASK-010', 'Should match with full prefix');

  const withoutPrefix = await selector.execute({ sprintSlug: 'beta' });
  assert.ok(withoutPrefix.ok && withoutPrefix.task.id === 'TASK-010', 'Should match with bare slug');
});

test('SelectNextTask without sprint filter ignores sprint field', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push(
    makeTask({ id: 'TASK-001', priority: 'P1', status: TaskStatus.READY, sprint: 'sprint/alpha' }),
    makeTask({ id: 'TASK-002', priority: 'P1', status: TaskStatus.READY, sprint: '' }),
  );
  const selector = new SelectNextTask(repo);

  const result = await selector.execute();

  assert.ok(result.ok && result.task.id === 'TASK-001', 'Should pick lowest TASK-ID regardless of sprint');
});
