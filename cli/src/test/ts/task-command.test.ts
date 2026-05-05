import { test } from 'node:test';
import assert from 'node:assert';
import { TaskCommand } from '../../main/ts/application/commands/task-command.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

class MockTaskRepository {
  async getById(id: string) {
    if (id === 'TASK-195') {
      return {
        id: 'TASK-195',
        title: 'Post-rollout Task',
        status: TaskStatus.IN_PROGRESS,
        content: '## TASK-195\n**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/',
        rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/',
        acceptanceCriteria: []
      };
    }
    return null;
  }
  async save() {}
  async getAll() { return []; }
  async getActive() { return []; }
  async findReady() { return []; }
  async getNextId() { return 'TASK-001'; }
}

class MockReviewer {
  reviewTask() { return { valid: true, violations: [] }; }
}

class MockFileSystem {
  async readFile(path: string) {
    if (path === 'arch.config.json') {
      return JSON.stringify({ hanseiSinceTaskId: 195 });
    }
    throw new Error(`File not found: ${path}`);
  }
  async writeFile() {}
  async exists() { return true; }
  async readDirectory() { return []; }
  async rename() {}
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

test('TaskCommand done - exits 1 when transition fails (e.g. missing Hansei)', async () => {
  const repo = new MockTaskRepository();
  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    new MockFileSystem() as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['done', 'TASK-195']));

  assert.strictEqual(exitCode, 1, 'task done must exit 1 when transition is blocked');
});

test('TaskCommand start - exits 1 when transition fails', async () => {
  const repo = new MockTaskRepository();
  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    new MockFileSystem() as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['start', 'TASK-999']));

  assert.strictEqual(exitCode, 1, 'task start must exit 1 on error');
});

test('TaskCommand metrics - exits 1 when update fails', async () => {
  const repo = new MockTaskRepository();
  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    new MockFileSystem() as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['metrics', 'TASK-999', '--cost', '0.05']));

  assert.strictEqual(exitCode, 1, 'task metrics must exit 1 on error');
});

test('TaskCommand done - exits 0 when transition passes', async () => {
  const repo = new MockTaskRepository();
  const fileSystem = new MockFileSystem();
  // Provide content WITH Hansei
  const getByIdOriginal = repo.getById;
  repo.getById = async (id: string) => {
    const task: any = await getByIdOriginal.call(repo, id);
    if (task) {
      task.content += '\n\n## Hansei\nAll good.';
    }
    return task;
  };

  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    fileSystem as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['done', 'TASK-195']));

  assert.strictEqual(exitCode, undefined, 'task done must not call process.exit(1) on success (should exit naturally with 0)');
});
