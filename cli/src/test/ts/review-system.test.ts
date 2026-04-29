import { test } from 'node:test';
import assert from 'node:assert';
import { ReviewSystem } from '../../main/ts/application/use-cases/review-system.js';
import { Reviewer } from '../../main/ts/domain/services/reviewer.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

const ACTIVE_TASK = {
  id: 'TASK-100',
  title: 'Active task',
  priority: 'P1',
  size: 'S',
  value: 5,
  status: TaskStatus.READY,
  sprint: 'Focus:no',
  class: '6-writing',
  cli: 'local',
  context: [],
  acceptanceCriteria: [],
  rawMetaLine: '**Meta:** P1 | S | 5 | READY | Focus:no | 6-writing | local | docs/',
};

const ARCHIVED_TASK_V4 = {
  id: 'TASK-001',
  title: 'Old archived task',
  priority: 'P0',
  size: 'S',
  value: 0,
  status: TaskStatus.DONE,
  sprint: 'Sprint 1',
  class: '',
  cli: '',
  context: [],
  acceptanceCriteria: [],
  rawMetaLine: '**Meta:** P0 | S | 5 | DONE | Sprint 1', // v0.4 format — no Focus field
};

class SpyTaskRepository {
  async getById() { return null; }
  async getAll() { return [ACTIVE_TASK, ARCHIVED_TASK_V4]; }
  async getActive() { return [ACTIVE_TASK]; }
  async save() {}
  async findReady() { return [ACTIVE_TASK]; }
  async getNextId() { return 'TASK-999'; }
}

class StubGitRepository {
  async getLastCommitMessage() { return 'feat: stub [TASK-001]'; }
  async getDiff() { return ''; }
  async getCurrentBranch() { return 'main'; }
  async getStatusLines() { return []; }
  async getLog() { return []; }
  async add() {}
  async commit() {}
}

test('ReviewSystem does not validate archived tasks', async () => {
  const repo = new SpyTaskRepository();
  const system = new ReviewSystem(repo as any, new StubGitRepository() as any, new Reviewer());

  const result = await system.execute();

  const archiveViolations = result.violations.filter(v => v.includes('TASK-001'));
  assert.strictEqual(
    archiveViolations.length,
    0,
    `archived task TASK-001 must not produce violations, got: ${archiveViolations.join(', ')}`
  );
});

test('ReviewSystem still validates active tasks', async () => {
  const doneTaskWithPendingAC = {
    ...ACTIVE_TASK,
    id: 'TASK-100',
    status: TaskStatus.DONE,
    acceptanceCriteria: [{ description: 'AC1', completed: false }],
  };

  class RepoWithDoneTask {
    async getById() { return null; }
    async getAll() { return [doneTaskWithPendingAC]; }
    async getActive() { return [doneTaskWithPendingAC]; }
    async save() {}
    async findReady() { return []; }
    async getNextId() { return 'TASK-999'; }
  }

  const system = new ReviewSystem(new RepoWithDoneTask() as any, new StubGitRepository() as any, new Reviewer());
  const result = await system.execute();

  assert.ok(
    result.violations.some(v => v.includes('TASK-100')),
    'active task with pending ACs must still be flagged'
  );
});
