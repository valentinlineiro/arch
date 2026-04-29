import { test } from 'node:test';
import assert from 'node:assert';
import { ReviewCommand } from '../../main/ts/application/commands/review-command.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

class SpyTaskRepository {
  saveCalls = 0;
  tasks: any[] = [];
  async getById() { return null; }
  async getAll() { return this.tasks; }
  async save() { this.saveCalls++; }
  async findReady() { return []; }
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

class ViolatingReviewer {
  reviewTask() { return { valid: false, violations: ['AC not completed'] }; }
  validateCommitMessage() { return { valid: true, violations: [] }; }
}

class PassingReviewer {
  reviewTask() { return { valid: true, violations: [] }; }
  validateCommitMessage() { return { valid: true, violations: [] }; }
}

class StubDriftChecker {
  async check() { return []; }
}

function captureExit(fn: () => Promise<void>): Promise<number | undefined> {
  return new Promise(async (resolve) => {
    const originalExit = process.exit;
    process.exit = ((code: number) => {
      process.exit = originalExit;
      resolve(code);
      throw new Error('process.exit');
    }) as any;
    try {
      await fn();
      process.exit = originalExit;
      resolve(undefined);
    } catch (e: any) {
      if (e.message !== 'process.exit') {
        process.exit = originalExit;
        throw e;
      }
    }
  });
}

test('ReviewCommand does not write or commit when violations exist', async () => {
  const repo = new SpyTaskRepository();
  repo.tasks.push({
    id: 'TASK-001',
    title: 'Test task',
    status: TaskStatus.READY,
    acceptanceCriteria: [{ description: 'AC1', completed: false }],
    rawMetaLine: '**Meta:** P1 | S | 5 | READY | Focus:no | 6-writing | claude | README.md'
  });

  const command = new ReviewCommand(
    repo as any,
    new StubGitRepository() as any,
    new ViolatingReviewer() as any,
    new StubDriftChecker() as any,
  );

  const exitCode = await captureExit(() => command.execute());

  assert.strictEqual(repo.saveCalls, 0, 'review must not call taskRepository.save() on failure');
  assert.strictEqual(exitCode, 1, 'review must exit 1 when violations exist');
});

test('ReviewCommand exits 0 and does not write when review passes', async () => {
  const repo = new SpyTaskRepository();
  const command = new ReviewCommand(
    repo as any,
    new StubGitRepository() as any,
    new PassingReviewer() as any,
    new StubDriftChecker() as any,
  );

  const exitCode = await captureExit(() => command.execute());

  assert.strictEqual(repo.saveCalls, 0, 'review must not write tasks on success');
  assert.strictEqual(exitCode, 0);
});
