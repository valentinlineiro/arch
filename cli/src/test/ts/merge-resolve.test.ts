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
- **Last Commit:** chore: [TASK-100] ours
=======
- **Last Commit:** chore: [TASK-101] theirs
>>>>>>> branch
`;
  fs.files['docs/INBOX.md'] = conflictContent;
  git.statusLines = ['UU docs/INBOX.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 1);
  assert.strictEqual(result.resolved[0], 'docs/INBOX.md');
  assert.ok(fs.files['docs/INBOX.md'].includes('ours'));
  assert.ok(fs.files['docs/INBOX.md'].includes('theirs'));
  assert.ok(!fs.files['docs/INBOX.md'].includes('<<<<<<<'));
  assert.ok(git.addedFiles.includes('docs/INBOX.md'));
});

test('MergeResolve - auto-resolves status-line-only on tasks', async () => {
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
  assert.ok(fs.files['docs/tasks/TASK-001.md'].includes('IN_PROGRESS'));
  assert.ok(!fs.files['docs/tasks/TASK-001.md'].includes('READY'));
  assert.ok(!fs.files['docs/tasks/TASK-001.md'].includes('<<<<<<<'));
});

test('MergeResolve - escalates protected paths', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  fs.files['arch.config.json'] = '<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> branch';
  git.statusLines = ['UU arch.config.json'];

  const useCase = new MergeResolve(git, fs, ['arch.config.json']);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 0);
  assert.strictEqual(result.escalated.length, 1);
  assert.strictEqual(result.escalated[0], 'arch.config.json');
});

test('MergeResolve - escalates non-meta task conflicts', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  
  const conflictContent = `## TASK-001: Title
**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none

### AC
<<<<<<< HEAD
- [ ] our ac
=======
- [ ] their ac
>>>>>>> branch
`;
  fs.files['docs/tasks/TASK-001.md'] = conflictContent;
  git.statusLines = ['UU docs/tasks/TASK-001.md'];

  const useCase = new MergeResolve(git, fs);
  const result = await useCase.execute();

  assert.strictEqual(result.resolved.length, 0);
  assert.strictEqual(result.escalated.length, 1);
});
