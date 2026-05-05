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

test('MergeResolve - auto-resolves pure-append on INBOX.md with chronological sorting', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `
## Recent Activity
<<<<<<< HEAD
## [2026-05-05 14:10] REVIEW_REQUEST | TASK-100
=======
## [2026-05-05 14:05] REVIEW_REQUEST | TASK-101
>>>>>>> branch
`;
  fs.files['docs/INBOX.md'] = conflictContent;
  git.statusLines = ['UU docs/INBOX.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 1);
  const merged = fs.files['docs/INBOX.md'];
  // 14:05 should come before 14:10
  const index101 = merged.indexOf('TASK-101');
  const index100 = merged.indexOf('TASK-100');
  assert.ok(index101 < index100, 'Chronological order should be preserved (TASK-101 before TASK-100)');
  assert.ok(!merged.includes('<<<<<<<'));
});

test('MergeResolve - escalates INBOX.md and skips logging', async () => {
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
  assert.strictEqual(result.escalated[0], 'docs/INBOX.md');
  
  // logToInbox should not have been called, so INBOX.md content should still have conflict markers
  assert.ok(fs.files['docs/INBOX.md'].includes('<<<<<<<'));
  // And it should not have been added to git (staged) by logToInbox
  assert.ok(!git.addedFiles.includes('docs/INBOX.md'));
});

test('MergeResolve - auto-resolves status-only meta conflict', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `## TASK-001: Title
<<<<<<< HEAD
**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none
=======
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | local | none
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
  assert.ok(merged.includes('IN_PROGRESS'));
  assert.ok(merged.includes('Focus:yes'));
});

test('MergeResolve - escalates task meta on semantic field mismatch (priority)', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `## TASK-001: Title
<<<<<<< HEAD
**Meta:** P2 | S | READY | Focus:no | 6-writing | local | none
=======
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | local | none
>>>>>>> branch
`;
  fs.files['docs/tasks/TASK-001.md'] = conflictContent;
  git.statusLines = ['UU docs/tasks/TASK-001.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 0);
  assert.strictEqual(result.escalated.length, 1);
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
