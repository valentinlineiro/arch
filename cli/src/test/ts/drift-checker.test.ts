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
  async getLog() { return []; }
  async add() {}
  async commit() {}
  async getFileLastModifiedDate() { return new Date(); }
  async getChangedFilesInLastCommit() { return []; }
  async getMergeCommits() { return []; }
  async rm() {}
  async mv() {}
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
  fs.files['/repo/docs/tasks/TASK-038.md'] = '**Meta:** P1 | S | READY | Focus:no | 7-operations | local | none';
  fs.files['/repo/docs/tasks/TASK-045.md'] = '**Meta:** P1 | S | READY | Focus:no | 7-operations | local | none';
  fs.files['/repo/docs/archive/TASK-038.md'] = '**Meta:** P1 | S | DONE | Focus:no | 7-operations | local | none';
  fs.files['/repo/docs/archive/TASK-047.md'] = '**Meta:** P1 | S | DONE | Focus:no | 7-operations | local | none';

  const checker = new DriftChecker(fs, git, '/repo', '0.2.0');

  const result = await checker.check();
  const drift = result.find(r => r.check === 'TaskArchive');

  assert.ok(drift);
  assert.strictEqual(drift?.status, 'WARN');
  assert.deepStrictEqual(drift?.details, ['Task exists in both active and archive: TASK-038']);
});

function makeBaseFs() {
  const fs = new MockFileSystem();
  fs.files['/repo/README.md'] = '';
  fs.files['/repo/arch.config.json'] = JSON.stringify({ version: '0.2.0' });
  fs.files['/repo/docs/AGENTS.md'] = '';
  fs.directories['/repo/docs/archive'] = [];
  return fs;
}

test('DependsGraph - OK when no dependencies exist', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] = '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] = '## TASK-002: B\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'DependsGraph');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('DependsGraph - WARN on unknown dependency reference', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] = '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** TASK-999';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'DependsGraph');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes("TASK-001") && d.includes("TASK-999")));
});

test('DependsGraph - WARN on circular dependency', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md', 'TASK-003.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] = '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** TASK-003';
  fs.files['/repo/docs/tasks/TASK-002.md'] = '## TASK-002: B\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** TASK-001';
  fs.files['/repo/docs/tasks/TASK-003.md'] = '## TASK-003: C\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** TASK-002';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'DependsGraph');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('Circular dependency')));
});

test('Census - OK when all directories are under budget', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    contextBudget: { 'docs/tasks': 1000 },
  });
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] = 'line1\nline2\nline3';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'Census');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('Census - WARN when directory exceeds budget with REFACTOR suggestion', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    contextBudget: { 'docs/tasks': 2 },
  });
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] = 'line1\nline2\nline3\nline4\nline5';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'Census');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('docs/tasks') && d.includes('REFACTOR')));
});

test('Census - WARN with PURGE suggestion for archive directory', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    contextBudget: { 'docs/archive': 2 },
  });
  fs.directories['/repo/docs/archive'] = ['TASK-001.md'];
  fs.files['/repo/docs/archive/TASK-001.md'] = 'line1\nline2\nline3\nline4\nline5';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'Census');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('docs/archive') && d.includes('PURGE')));
});

test('Census - OK when no contextBudget configured', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] = 'lots of content\n'.repeat(10000);

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'Census');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('Census - skips missing directories gracefully', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    contextBudget: { 'docs/nonexistent': 100 },
  });

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'Census');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('DependsGraph - OK when dependency is in archive', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-002.md'];
  fs.directories['/repo/docs/archive'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-002.md'] = '## TASK-002: B\n**Meta:** P1 | S | READY | Focus:no | 6-writing | local | none\n**Depends:** TASK-001';
  fs.files['/repo/docs/archive/TASK-001.md'] = '## TASK-001: A\n**Meta:** P1 | S | DONE | Focus:no | 6-writing | local | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'DependsGraph');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('DriftChecker - HanseiPresent flags archived task missing Hansei section', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    hanseiSinceTaskId: 195,
  });
  fs.directories['/repo/docs/archive'] = ['TASK-010.md'];
  fs.files['/repo/docs/archive/TASK-010.md'] = '## TASK-010: Something\n**Meta:** P1 | S | DONE | Focus:no\n\nNo Hansei here.\n';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'HanseiPresent');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('DriftChecker - HanseiPresent flags archived task missing Hansei section after rollout threshold', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    hanseiSinceTaskId: 195,
  });
  fs.directories['/repo/docs/archive'] = ['TASK-195.md'];
  fs.files['/repo/docs/archive/TASK-195.md'] = '## TASK-195: Something\n**Meta:** P1 | S | DONE | Focus:no\n\nNo Hansei here.\n';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'HanseiPresent');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('TASK-195')));
});

test('DriftChecker - HanseiPresent passes when all archived tasks have Hansei section', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    hanseiSinceTaskId: 195,
  });
  fs.directories['/repo/docs/archive'] = ['TASK-195.md', 'TASK-196.md'];
  fs.files['/repo/docs/archive/TASK-195.md'] = '## TASK-195: Something\n**Meta:** P1 | S | DONE | Focus:no\n\n## Hansei\nReflection here.\n';
  fs.files['/repo/docs/archive/TASK-196.md'] = '## TASK-196: Another\n**Meta:** P1 | S | DONE | Focus:no\n\n## Hansei\nMore reflection.\n';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'HanseiPresent');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});
