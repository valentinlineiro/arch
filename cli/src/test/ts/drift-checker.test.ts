import { test } from 'node:test';
import assert from 'node:assert';
import { DriftChecker } from '../../main/ts/domain/services/drift-checker.js';
import { FileSystem } from '../../main/ts/domain/repositories/file-system.js';
import { GitRepository } from '../../main/ts/domain/repositories/git-repository.js';

class MockFileSystem implements FileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};

  async readFile(path: string) { return this.files[path]; }
  async writeFile(path: string, content: string) { this.files[path] = content; }
  async exists(path: string) { return path in this.files || path in this.directories; }
  async readDirectory(path: string) { return this.directories[path] ?? []; }
  async rename(oldPath: string, newPath: string) {}
}

class MockGitRepository implements GitRepository {
  diff = '';
  lastCommitMessage: string | null = null;
  currentBranch = 'main';
  statusLines: string[] = [];

  async getDiff() { return this.diff; }
  async getLastCommitMessage() { return this.lastCommitMessage; }
  async getCurrentBranch() { return this.currentBranch; }
  async getStatusLines() { return this.statusLines; }
}

test('DriftChecker - reports dirty worktree tracked deletions and runtime artifacts', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  fs.files['/repo/README.md'] = '';
  fs.files['/repo/arch.config.json'] = JSON.stringify({ version: '0.2.0' });
  fs.files['/repo/docs/AGENTS.md'] = '';
  fs.directories['/repo/docs/tasks'] = [];
  fs.directories['/repo/docs/archive'] = [];
  git.statusLines = [' D docs/tasks/TASK-038.md', '?? .codex'];

  const checker = new DriftChecker(fs, git, '/repo', '0.2.0');
  const result = await checker.check();
  const worktree = result.find(r => r.check === 'Worktree');

  assert.ok(worktree);
  assert.strictEqual(worktree?.status, 'WARN');
  assert.ok(worktree?.details.some(d => d.includes('Runtime artifact not ignored locally: .codex')));
});

test('DriftChecker - reports duplicated task ids across active and archive', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  fs.files['/repo/README.md'] = '';
  fs.files['/repo/arch.config.json'] = JSON.stringify({ version: '0.2.0' });
  fs.files['/repo/docs/AGENTS.md'] = '';
  fs.directories['/repo/docs/tasks'] = ['TASK-038.md', 'TASK-045.md'];
  fs.directories['/repo/docs/archive'] = ['TASK-038.md', 'TASK-047.md'];
  
  // Provide content for the files to avoid readFile returning undefined
  fs.files['/repo/docs/tasks/TASK-038.md'] = '**Meta:** P1 | S | 5 | READY | Focus:no | 7-operations | local | none';
  fs.files['/repo/docs/tasks/TASK-045.md'] = '**Meta:** P1 | S | 5 | READY | Focus:no | 7-operations | local | none';
  fs.files['/repo/docs/archive/TASK-038.md'] = '**Meta:** P1 | S | 5 | DONE | Focus:no | 7-operations | local | none';
  fs.files['/repo/docs/archive/TASK-047.md'] = '**Meta:** P1 | S | 5 | DONE | Focus:no | 7-operations | local | none';

  const checker = new DriftChecker(fs, git, '/repo', '0.2.0');

  const result = await checker.check();
  const drift = result.find(r => r.check === 'TaskArchive');

  assert.ok(drift);
  assert.strictEqual(drift?.status, 'WARN');
  assert.deepStrictEqual(drift?.details, ['Task exists in both active and archive: TASK-038']);
});
