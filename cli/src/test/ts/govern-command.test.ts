import { test } from 'node:test';
import assert from 'node:assert';
import { GovernCommand } from '../../main/ts/application/commands/govern-command.js';

class MockFileSystem {
  files: Record<string, string> = {
    'arch.config.json': JSON.stringify({ governance: { conductEveryN: 3 }, contextRules: {} }),
  };

  async readFile(path: string): Promise<string> {
    if (!(path in this.files)) throw new Error(`Not found: ${path}`);
    return this.files[path];
  }
  async writeFile(path: string, content: string): Promise<void> { this.files[path] = content; }
  async exists(path: string): Promise<boolean> { return path in this.files; }
  async readDirectory(): Promise<string[]> { return []; }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
  async deleteFile(_p: string) {}
}

class EmptyTaskRepository {
  async getById() { return null; }
  async getAll() { return []; }
  async getActive() { return []; }
  async save() {}
  async findReady() { return []; }
  async getNextId() { return 'TASK-001'; }
}

class FailingHistoryGitRepository {
  async getDiff() { return ''; }
  async getLastCommitMessage() { return null; }
  async getCurrentBranch() { return 'main'; }
  async getStatusLines() { return []; }
  async getLog() { return []; }
  async add() {}
  async rm() {}
  async mv() {}
  async commit() {}
  async getFileLastModifiedDate() { return null; }
  async getChangedFilesInLastCommit() { return []; }
  async getMergeCommits() { return []; }
  async getStagedFiles() { return []; }
  async getModifiedFiles() { return []; }
  async getRepoRoot() { return '/repo'; }
  async getCommitHistory() {
    throw new Error('git log failed');
  }
}

test('GovernCommand fails when context index rebuild fails', async () => {
  const command = new GovernCommand(
    new EmptyTaskRepository() as any,
    new FailingHistoryGitRepository() as any,
    new MockFileSystem() as any,
  );

  await assert.rejects(
    () => command.execute(['--no-conduct']),
    /failed to rebuild context index during govern/,
  );
});
