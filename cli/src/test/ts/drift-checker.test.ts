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
  async mkdir(path: string) {}
}

class MockGitRepository implements GitRepository {
  diff = '';
  lastCommitMessage: string | null = null;
  currentBranch = 'main';
  statusLines: string[] = [];
  changedFilesInLastCommit: string[] = [];

  async getDiff() { return this.diff; }
  async getLastCommitMessage() { return this.lastCommitMessage; }
  async getCurrentBranch() { return this.currentBranch; }
  async getStatusLines() { return this.statusLines; }
  async getLog() { return []; }
  async add() {}
  async commit() {}
  async getFileLastModifiedDate() { return new Date(); }
  async getChangedFilesInLastCommit() { return this.changedFilesInLastCommit; }
  async getMergeCommits() { return []; }
  async rm() {}
  async mv() {}
  async getStagedFiles() { return []; }
  async getModifiedFiles() { return []; }
  async getRepoRoot() { return ''; }
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

test('DriftChecker - HaltPolicy flags missing HALT.md or HALT-LOG.md', async () => {
  const fs = makeBaseFs();
  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'HaltPolicy');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('docs/HALT.md not found')));
  assert.ok(check?.details.some(d => d.includes('docs/HALT-LOG.md not found')));
});

test('DriftChecker - HaltPolicy flags invalid table structure in HALT.md', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/docs/HALT.md'] = '# Halt Conditions\n\nInvalid table here.';
  fs.files['/repo/docs/HALT-LOG.md'] = '# Halt Log';
  
  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'HaltPolicy');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('table structure is invalid')));
});

test('EscalationMaturity - WARN when last commit touches protected path without ADR', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    governance: { protectedPaths: ['cli/src/main/ts/domain/'] },
  });
  fs.directories['/repo/docs/tasks'] = [];
  fs.directories['/repo/docs/adr'] = [];

  const git = new MockGitRepository();
  git.changedFilesInLastCommit = ['cli/src/main/ts/domain/services/drift-checker.ts'];

  const checker = new DriftChecker(fs, git, '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'EscalationMaturity');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('Last commit modifies protected path(s) without a new ADR')));
});

test('EscalationMaturity - OK when last commit touches protected path WITH ADR', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    governance: { protectedPaths: ['cli/src/main/ts/domain/'] },
  });
  fs.directories['/repo/docs/tasks'] = [];
  fs.directories['/repo/docs/adr'] = [];

  const git = new MockGitRepository();
  git.changedFilesInLastCommit = [
    'cli/src/main/ts/domain/services/drift-checker.ts',
    'docs/adr/ADR-010-escalation-maturity.md',
  ];

  const checker = new DriftChecker(fs, git, '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'EscalationMaturity');

  assert.ok(check);
  assert.ok(
    check?.status === 'OK' ||
    !check?.details.some(d => d.includes('Last commit modifies protected path(s) without a new ADR'))
  );
});

test('EscalationMaturity - WARN when task is in REVIEW after prior rejection (REVIEW->READY->REVIEW cycle)', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/arch.config.json'] = JSON.stringify({
    version: '0.2.0',
    governance: { protectedPaths: [] },
  });
  fs.directories['/repo/docs/tasks'] = ['TASK-010.md'];
  fs.files['/repo/docs/tasks/TASK-010.md'] =
    '## TASK-010: Something\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | local | none\n**Rejected-at:** 2026-05-01T00:00:00.000Z\n**Reason:** AC not met\n\n### Acceptance Criteria\n- [x] Done\n';

  const git = new MockGitRepository();

  const checker = new DriftChecker(fs, git, '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'EscalationMaturity');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('TASK-010') && d.includes('REVIEW')));
});

test('DriftChecker - HaltPolicy passes with valid files', async () => {
  const fs = makeBaseFs();
  fs.files['/repo/docs/HALT.md'] = '# Halt Conditions\n\n| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|';
  fs.files['/repo/docs/HALT-LOG.md'] = '# Halt Log';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'HaltPolicy');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

// ─── OrphanTasks ─────────────────────────────────────────────────────────────

test('OrphanTasks - OK when all tasks are in the active root set', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - OK when a downstream task is reachable from an active root', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P2 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** TASK-001';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - OK for a transitive downstream chain from an active root', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md', 'TASK-003.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P2 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** TASK-001';
  fs.files['/repo/docs/tasks/TASK-003.md'] =
    '## TASK-003: C\n**Meta:** P3 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** TASK-002';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - WARN when a task is structurally disconnected from all active roots', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P3 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('TASK-002') && d.includes('orphan')));
});

test('OrphanTasks - OK when no active root set exists (empty system)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - OK when a REVIEW task exists alongside active roots', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

// ─── ObsoleteGuidelines ───────────────────────────────────────────────────────

test('ObsoleteGuidelines - OK when all referenced paths exist', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/guidelines'] = ['core.md'];
  fs.files['/repo/docs/guidelines/core.md'] = 'See `docs/tasks/` for task files.';
  fs.directories['/repo/docs/tasks'] = [];

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('ObsoleteGuidelines - WARN when a guideline references a dead path', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/guidelines'] = ['core.md'];
  fs.files['/repo/docs/guidelines/core.md'] = 'Old rule: use `docs/sprint/` folder.';
  // docs/sprint/ does NOT exist in the mock fs

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('core.md') && d.includes("docs/sprint/")));
});

test('ObsoleteGuidelines - OK when guidelines directory does not exist', async () => {
  const fs = makeBaseFs();
  // No docs/guidelines directory at all

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('ObsoleteGuidelines - skips glob patterns (paths with *)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/guidelines'] = ['core.md'];
  fs.files['/repo/docs/guidelines/core.md'] = 'Files matching `docs/tasks/*.md` are task files.';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

// ─── UnappliedADRs ────────────────────────────────────────────────────────────

test('UnappliedADRs - OK when all ACCEPTED ADRs are referenced in task files', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-001-some-decision.md'];
  fs.files['/repo/docs/adr/ADR-001-some-decision.md'] =
    '# ADR-001\n**Status:** ACCEPTED\n\n## Decision\nWe use git.';
  fs.directories['/repo/docs/tasks'] = ['TASK-010.md'];
  fs.files['/repo/docs/tasks/TASK-010.md'] =
    '## TASK-010: Implement ADR-001\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | none\n**Depends:** none\nImplements ADR-001.';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('UnappliedADRs - WARN when an ACCEPTED ADR has no task reference', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-003-some-decision.md'];
  fs.files['/repo/docs/adr/ADR-003-some-decision.md'] =
    '# ADR-003\n**Status:** ACCEPTED\n\n## Decision\nWe use flat files.';
  fs.directories['/repo/docs/tasks'] = ['TASK-010.md'];
  fs.files['/repo/docs/tasks/TASK-010.md'] =
    '## TASK-010: Something else\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('ADR-003') && d.includes('never referenced')));
});

test('UnappliedADRs - OK for DRAFT and SUPERSEDED ADRs (not checked)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-002-draft.md', 'ADR-004-old.md'];
  fs.files['/repo/docs/adr/ADR-002-draft.md'] =
    '# ADR-002\n**Status:** DRAFT\n\n## Decision\nTBD.';
  fs.files['/repo/docs/adr/ADR-004-old.md'] =
    '# ADR-004\n**Status:** SUPERSEDED\n\n## Decision\nOld way.';
  fs.directories['/repo/docs/tasks'] = [];

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('UnappliedADRs - OK when ADR is referenced in archive (not just tasks)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-005-archived-impl.md'];
  fs.files['/repo/docs/adr/ADR-005-archived-impl.md'] =
    '# ADR-005\n**Status:** ACCEPTED\n\n## Decision\nUse flat tasks.';
  fs.directories['/repo/docs/tasks'] = [];
  fs.directories['/repo/docs/archive'] = ['TASK-005.md'];
  fs.files['/repo/docs/archive/TASK-005.md'] =
    '## TASK-005: Implemented ADR-005\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('UnappliedADRs - OK when docs/adr directory does not exist', async () => {
  const fs = makeBaseFs();
  // No docs/adr directory

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});
