import { test } from 'node:test';
import assert from 'node:assert';
import { GetSprintStatus } from '../../main/ts/application/use-cases/get-sprint-status.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockTaskRepository, MockFileSystem } from './mocks/index.js';

const makeTask = (overrides: Partial<Task>): Task => ({
  id: 'TASK-001',
  title: 'Task',
  priority: 'P2',
  size: 'S',
  status: TaskStatus.READY,
  focus: FocusLevel.NONE,
  sprint: '',
  class: '2-code-generation',
  cli: 'claude',
  context: ['cli/src/main/ts/application/commands/status-command.ts'],
  content: '',
  filePath: '',
  acceptanceCriteria: [],
  ...overrides,
} as Task);

test('GetSprintStatus includes current sprint progress from config and Sprint field', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push(
    makeTask({ id: 'TASK-001', sprint: 'sprint/control-panel', status: TaskStatus.DONE }),
    makeTask({ id: 'TASK-002', sprint: 'sprint/control-panel', status: TaskStatus.REVIEW }),
    makeTask({ id: 'TASK-003', sprint: 'sprint/other', status: TaskStatus.DONE }),
  );
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ currentSprint: 'sprint/control-panel' });

  const result = await new GetSprintStatus(repo as any, fs as any).execute();

  assert.deepStrictEqual(result.sprint, {
    name: 'sprint/control-panel',
    done: 1,
    total: 2
  });
});

test('GetSprintStatus omits sprint section when no sprint is active', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push(makeTask({ id: 'TASK-001', sprint: 'sprint/control-panel' }));
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ currentSprint: '' });

  const result = await new GetSprintStatus(repo as any, fs as any).execute();

  assert.strictEqual(result.sprint, null);
});
