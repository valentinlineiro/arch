import { test } from 'node:test';
import assert from 'node:assert';
import { GovernCommand } from '../../main/ts/application/commands/govern-command.js';
import { MockFileSystem } from './mocks/index.js';

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
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ governance: { conductEveryN: 3 }, contextRules: {} });
  const command = new GovernCommand(
    new EmptyTaskRepository() as any,
    new FailingHistoryGitRepository() as any,
    fs as any,
  );

  await assert.rejects(
    () => command.execute(['--no-conduct']),
    /failed to rebuild context index during govern/,
  );
});
