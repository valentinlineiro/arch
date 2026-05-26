import { test } from 'node:test';
import assert from 'node:assert';
import { CheckSystem } from '../../main/ts/application/use-cases/check-system.js';
import { Reviewer } from '../../main/ts/domain/services/reviewer.js';
import { TaskStatus, Task, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockFileSystem, MockTaskRepository, MockGitRepository } from './mocks/index.js';

const ACTIVE_TASK: Task = {
  id: 'TASK-100',
  title: 'Active task',
  priority: 'P1',
  size: 'S',
  status: TaskStatus.READY,
  focus: FocusLevel.NONE,
  sprint: 'Focus:no',
  class: '6-writing',
  cli: 'local',
  context: [],
  acceptanceCriteria: [],
  rawMetaLine: '**Meta:** P1 | S | 5 | READY | Focus:no | 6-writing | local | docs/',
  filePath: 'docs/tasks/TASK-100.md',
  content: '',
  depends: [],
};

const ARCHIVED_TASK_V4: Task = {
  id: 'TASK-001',
  title: 'Old archived task',
  priority: 'P0',
  size: 'S',
  status: TaskStatus.DONE,
  focus: FocusLevel.NONE,
  sprint: 'Sprint 1',
  class: '6-writing',
  cli: 'local',
  context: [],
  acceptanceCriteria: [],
  rawMetaLine: '**Meta:** P0 | S | 5 | DONE | Sprint 1', // v0.4 format — no Focus field
  filePath: 'docs/archive/TASK-001.md',
  content: '',
  depends: [],
};

test('CheckSystem does not validate archived tasks', async () => {
  const repo = new MockTaskRepository();
  repo.tasks = [ACTIVE_TASK];
  repo.archivedTasks = [ARCHIVED_TASK_V4];
  
  const system = new CheckSystem(repo, new MockGitRepository(), new Reviewer(), new MockFileSystem());

  const result = await system.execute();

  const archiveViolations = result.violations.filter(v => v.includes('TASK-001'));
  assert.strictEqual(
    archiveViolations.length,
    0,
    `archived task TASK-001 must not produce violations, got: ${archiveViolations.join(', ')}`
  );
});

test('CheckSystem still validates active DONE/REVIEW tasks with pending ACs', async () => {
  for (const status of [TaskStatus.DONE, TaskStatus.REVIEW]) {
    const activeTaskWithPendingAC: Task = {
      ...ACTIVE_TASK,
      id: `TASK-10${status === TaskStatus.DONE ? '0' : '1'}`,
      status,
      acceptanceCriteria: [{ description: 'AC1', completed: false }],
    };

    const repo = new MockTaskRepository();
    repo.tasks = [activeTaskWithPendingAC];

    const system = new CheckSystem(repo, new MockGitRepository(), new Reviewer(), new MockFileSystem());
    const result = await system.execute();

    assert.ok(
      result.violations.some(v => v.includes(activeTaskWithPendingAC.id) && v.includes(`marked as ${status}`)),
      `active ${status} task with pending ACs must be flagged`
    );
  }
});
