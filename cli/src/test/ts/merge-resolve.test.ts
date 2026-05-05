import { test } from 'node:test';
import assert from 'node:assert';
import { MergeResolve } from '../../main/ts/application/use-cases/merge-resolve.js';
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
  statusLines: string[] = [];
  addedFiles: string[] = [];

  async getDiff() { return ''; }
  async getLastCommitMessage() { return null; }
  async getCurrentBranch() { return 'main'; }
  async getStatusLines() { return this.statusLines; }
  async getLog() { return []; }
  async add(path: string) { this.addedFiles.push(path); }
  async commit() {}
  async getFileLastModifiedDate() { return new Date(); }
  async getChangedFilesInLastCommit() { return []; }
  async getMergeCommits() { return []; }
  async rm() {}
  async mv() {}
}

test('MergeResolve - auto-resolves pure-append on INBOX.md', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `
## Recent Activity
<<<<<<< HEAD
## [2026-05-05 14:00] REVIEW_REQUEST | TASK-100
=======
## [2026-05-05 14:05] REVIEW_REQUEST | TASK-101
>>>>>>> branch
`;
  fs.files['docs/INBOX.md'] = conflictContent;
  git.statusLines = ['UU docs/INBOX.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 1);
  assert.ok(fs.files['docs/INBOX.md'].includes('TASK-100'));
  assert.ok(fs.files['docs/INBOX.md'].includes('TASK-101'));
  assert.ok(!fs.files['docs/INBOX.md'].includes('<<<<<<<'));
});

test('MergeResolve - escalates INBOX.md singleton collision', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `
<<<<<<< HEAD
- **Backlog (Ready):** 16
=======
- **Backlog (Ready):** 15
>>>>>>> branch
`;
  fs.files['docs/INBOX.md'] = conflictContent;
  git.statusLines = ['UU docs/INBOX.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 0);
  assert.strictEqual(result.escalated.length, 1);
});

test('MergeResolve - semantic merge for task meta (advanced status and higher priority wins)', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `## TASK-001: Title
<<<<<<< HEAD
**Meta:** P2 | S | READY | Focus:no | 6-writing | local | path/a | Cost: $10.00 | Steps: 5
=======
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | local | path/b | Cost: $5.00 | Steps: 10
>>>>>>> branch

### AC
- [ ] test
`;
  fs.files['docs/tasks/TASK-001.md'] = conflictContent;
  git.statusLines = ['UU docs/tasks/TASK-001.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 1);
  const merged = fs.files['docs/tasks/TASK-001.md'];
  assert.ok(merged.includes('P1'), 'P1 should win over P2');
  assert.ok(merged.includes('IN_PROGRESS'), 'IN_PROGRESS should win over READY');
  assert.ok(merged.includes('Focus:yes'), 'Focus:yes should win');
  assert.ok(merged.includes('path/a, path/b'), 'Context should be unioned');
  assert.ok(merged.includes('Cost: $10.00'), 'Max cost should win');
  assert.ok(merged.includes('Steps: 10'), 'Max steps should win');
});

test('MergeResolve - escalates task meta on immutable field mismatch', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `## TASK-001: Title
<<<<<<< HEAD
**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none
=======
**Meta:** P1 | M | READY | Focus:no | 6-writing | local | none
>>>>>>> branch
`;
  fs.files['docs/tasks/TASK-001.md'] = conflictContent;
  git.statusLines = ['UU docs/tasks/TASK-001.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 0);
  assert.strictEqual(result.escalated.length, 1);
});

test('MergeResolve - detects all unmerged states (DD, DU, etc.)', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  fs.files['file1'] = 'conflict';
  fs.files['file2'] = 'conflict';
  git.statusLines = ['DD file1', 'DU file2'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  // Both should be detected as conflicting, even if not auto-resolvable
  assert.strictEqual(result.escalated.length, 2);
});
