import { test } from 'node:test';
import assert from 'node:assert';
import { ReviewCommand } from '../../main/ts/application/commands/review-command.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

class SpyTaskRepository {
  saveCalls = 0;
  tasks: any[] = [];
  async getById(id: string) { return this.tasks.find(t => t.id === id) || null; }
  async getAll() { return this.tasks; }
  async getActive() { return this.tasks; }
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
  async getChangedFilesInLastCommit() { return []; }
  async getMergeCommits() { return []; }
}

class StubFileSystem {
  async exists() { return false; }
  async readFile() { return '{}'; }
  async deleteFile(_p: string) {}
  async readDirectory() { return []; }
  async writeFile() {}
}

test('ReviewCommand --help exits 0', async () => {
  const command = new ReviewCommand(
    new SpyTaskRepository() as any,
    new StubGitRepository() as any,
    new StubFileSystem() as any,
  );
  // Should not throw or exit
  await command.execute(['--help']);
});

test('ReviewCommand lists no REVIEW tasks', async () => {
  const repo = new SpyTaskRepository();
  repo.tasks.push({
    id: 'TASK-001',
    title: 'Test task',
    status: TaskStatus.DONE,
    content: '## TASK-001\n**Meta:** P1 | S | DONE | Focus:no | 6-writing | claude | docs/',
    acceptanceCriteria: [],
    filePath: 'docs/archive/TASK-001.md',
  });

  const command = new ReviewCommand(
    repo as any,
    new StubGitRepository() as any,
    new StubFileSystem() as any,
  );

  await command.execute([]);
});
