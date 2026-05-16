import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MarkTaskInProgress, DefinitionOfReadyError } from '../../main/ts/application/use-cases/mark-task-in-progress.js';
import { NextCommand } from '../../main/ts/application/commands/next-command.js';
import { DriftChecker } from '../../main/ts/application/use-cases/drift-checker.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import type { Task } from '../../main/ts/domain/models/task.js';

// ── Shared Mocks ────────────────────────────────────────────────────────────

class MockFileSystem {
  files: Record<string, string> = {};
  async readFile(path: string): Promise<string> {
    if (path in this.files) return this.files[path];
    throw new Error(`Not found: ${path}`);
  }
  async writeFile(path: string, content: string): Promise<void> { this.files[path] = content; }
  async exists(path: string): Promise<boolean> {
    return path in this.files || Object.keys(this.files).some(k => k.startsWith(path + '/'));
  }
  async readDirectory(path: string): Promise<string[]> {
    return [...new Set(
      Object.keys(this.files)
        .filter(k => k.startsWith(path + '/'))
        .map(k => k.slice(path.length + 1).split('/')[0])
    )];
  }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
  async deleteFile(): Promise<void> {}
  async appendFile(path: string, content: string): Promise<void> {
    this.files[path] = (this.files[path] ?? '') + content;
  }
}

class MockTaskRepository {
  private tasks: Map<string, Task> = new Map();
  constructor(tasks: Task[] = []) {
    tasks.forEach(t => this.tasks.set(t.id, t));
  }
  async getById(id: string) { return this.tasks.get(id) ?? null; }
  async save(task: Task) { this.tasks.set(task.id, task); }
  async getAll() { return Array.from(this.tasks.values()); }
  async getActive() { return Array.from(this.tasks.values()).filter(t => t.status !== TaskStatus.DONE); }
  async findReady() { return Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.READY); }
  async getNextId() { return 'TASK-999'; }
}

class MockGitRepository {
  statusLines: string[] = [];
  lastCommitFiles: string[] = [];
  lastCommitHash = 'abc1234';

  async getStatusLines() { return this.statusLines; }
  async getChangedFilesInLastCommit() { return this.lastCommitFiles; }
  async getLastCommitHash() { return this.lastCommitHash; }
  async getLastCommitMessage() { return 'chore: test [TASK-001]'; }
  async getCurrentBranch() { return 'main'; }
  async getDiff() { return ''; }
  async getLog() { return []; }
  async getMergeCommits() { return []; }
  async getStagedFiles() { return []; }
  async getModifiedFiles() { return []; }
  async getRepoRoot() { return '/tmp'; }
  async getFileLastModifiedDate() { return null; }
  async getFileFirstCommitDate() { return null; }
  async isValidCommitHash() { return true; }
  async getCommitAuthor() { return null; }
  async getCommitHistory() { return []; }
  async add() {}
  async rm() {}
  async mv() {}
  async commit() {}
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-001',
    title: 'Test task',
    status: TaskStatus.READY,
    priority: 'P2',
    size: 'S',
    class: '7-operations',
    cli: 'local',
    context: [],
    focus: true,
    depends: [],
    content: '## TASK-001: Test\n**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] do something\n  - `prose: verified manually`\n\n## Hansei\n**Severity:** H0\n**Category:** [no-issue]\n**Decision:** Test.\n**Constraint:** None.\n**Cost:** None.\n**Forward Action:** None required.\n',
    rawMetaLine: '**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | none',
    sprint: '',
    ...overrides,
  } as unknown as Task;
}

// ── Scenario (a): Protected path edit without ADR triggers drift violation ──

test('EscalationMaturity E5 — (a) protected path modified without ADR causes EscalationMaturity WARN', async () => {
  const fs = new MockFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({
    governance: { protectedPaths: ['docs/guidelines/'], negativeConstraints: [] },
  });
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks/TASK-001.md'] = makeTask().content;
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';
  fs.files['./docs/guidelines/core.md'] = '';

  const git = new MockGitRepository();
  // Simulating: docs/guidelines/core.md modified, no ADR added
  git.lastCommitFiles = ['docs/guidelines/core.md'];
  git.statusLines = ['M  docs/guidelines/core.md'];

  const taskRepo = new MockTaskRepository([makeTask()]);

  const checker = new DriftChecker(fs as any, git as any, '.', '0.6.0');
  const results = await checker.check();

  const escalation = results.find(r => r.check === 'EscalationMaturity');
  assert.ok(escalation, 'EscalationMaturity check must exist');
  assert.equal(escalation.status, 'WARN', 'should WARN when protected path modified without ADR');
  assert.ok(
    escalation.details.some(d => d.includes('docs/guidelines/core.md')),
    `expected protected path in details, got: ${JSON.stringify(escalation.details)}`
  );
});

// ── Scenario (b): Ambiguous task shape blocked at arch task start ──────────

test('EscalationMaturity E5 — (b) ambiguous task (missing class) blocked at arch task start with exit 1', async () => {
  const malformedTask = makeTask({
    id: 'TASK-002',
    class: '', // missing class
    content: '## TASK-002: No class\n**Meta:** P2 | S | READY | Focus:yes | | local | none\n\n### Acceptance Criteria\n- [ ] do something\n',
    rawMetaLine: '**Meta:** P2 | S | READY | Focus:yes | | local | none',
  });

  const taskRepo = new MockTaskRepository([malformedTask]);
  const markInProgress = new MarkTaskInProgress(taskRepo as any);

  await assert.rejects(
    () => markInProgress.execute('TASK-002', 'cli'),
    (err: Error) => {
      assert.ok(err instanceof DefinitionOfReadyError, `expected DefinitionOfReadyError, got ${err.constructor.name}`);
      assert.ok(err.reasons.some(r => r.includes('class')), `expected class violation, got: ${err.reasons}`);
      return true;
    }
  );
});

// ── Scenario (c): Stale INBOX blocks arch task next ──────────────────────

test('EscalationMaturity E5 — (c) stale INBOX (>24h) blocks arch task next via NextCommand', async () => {
  const fs = new MockFileSystem();
  // INBOX with a 72h-old timestamp
  fs.files['./docs/INBOX.md'] = '<!-- generated: 2026-05-13T00:00:00Z -->\n# INBOX\n\nNo items.\n';

  const readyTask = makeTask({ id: 'TASK-003' });
  const taskRepo = new MockTaskRepository([readyTask]);

  // NextCommand checks INBOX freshness before selecting
  const command = new NextCommand(taskRepo as any, [], undefined, fs as any, '.');

  // Capture process.exit without actually exiting
  let exitCode: number | undefined;
  const originalExit = process.exit.bind(process);
  (process as any).exit = (code?: number) => { exitCode = code; throw new Error(`process.exit(${code})`); };

  try {
    await command.execute();
  } catch (err: any) {
    assert.ok(err.message.includes('process.exit(1)'), `expected exit(1), got: ${err.message}`);
  } finally {
    (process as any).exit = originalExit;
  }

  assert.equal(exitCode, 1, 'stale INBOX must cause NextCommand to exit 1');
});

// ── Scenario: Unresolved halt in HALT-LOG causes HaltPolicy WARN ──────────

test('EscalationMaturity E5 — unresolved halt entry causes HaltPolicy WARN', async () => {
  const fs = new MockFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({
    governance: { protectedPaths: [], negativeConstraints: [] },
  });
  // HALT-LOG row with empty Resolution column
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n| 2026-05-16T10:00:00Z | ANDON_HALT | TASK-100 | Protected path edit | |\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks/TASK-001.md'] = makeTask().content;
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';

  const git = new MockGitRepository();
  const taskRepo = new MockTaskRepository([makeTask()]);

  const checker = new DriftChecker(fs as any, git as any, '.', '0.6.0');
  const results = await checker.check();

  const haltPolicy = results.find(r => r.check === 'HaltPolicy');
  assert.ok(haltPolicy, 'HaltPolicy check must exist');
  assert.equal(haltPolicy.status, 'WARN', 'should WARN when halt entry has no resolution');
  assert.ok(
    haltPolicy.details.some(d => d.includes('Unresolved halt')),
    `expected unresolved halt detail, got: ${JSON.stringify(haltPolicy.details)}`
  );
});

// ── FocusStatusAlignment tests ─────────────────────────────────────────────

test('FocusStatusAlignment — IN_PROGRESS + Focus:no → WARN', async () => {
  const fs = new MockFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({ governance: { protectedPaths: [], negativeConstraints: [] } });
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks'] = '';
  fs.files['./docs/tasks/TASK-010.md'] = '## TASK-010: Test\n**Meta:** P2 | S | IN_PROGRESS | Focus:no | 7-operations | local | none\n\n- [x] done\n';
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';

  const git = new MockGitRepository();
  const checker = new DriftChecker(fs as any, git as any, '.', '0.6.0');
  const results = await checker.check();

  const check = results.find(r => r.check === 'FocusStatusAlignment');
  assert.ok(check, 'FocusStatusAlignment check must exist');
  assert.equal(check.status, 'WARN');
  assert.ok(check.details.some(d => d.includes('IN_PROGRESS') && d.includes('Focus:no')));
});

test('FocusStatusAlignment — READY + Focus:yes → WARN', async () => {
  const fs = new MockFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({ governance: { protectedPaths: [], negativeConstraints: [] } });
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks'] = '';
  fs.files['./docs/tasks/TASK-011.md'] = '## TASK-011: Test\n**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | none\n\n- [x] done\n';
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';

  const git = new MockGitRepository();
  const checker = new DriftChecker(fs as any, git as any, '.', '0.6.0');
  const results = await checker.check();

  const check = results.find(r => r.check === 'FocusStatusAlignment');
  assert.ok(check, 'FocusStatusAlignment check must exist');
  assert.equal(check.status, 'WARN');
  assert.ok(check.details.some(d => d.includes('READY') && d.includes('Focus:yes')));
});

test('FocusStatusAlignment — REVIEW + Focus:yes → OK (permitted)', async () => {
  const fs = new MockFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({ governance: { protectedPaths: [], negativeConstraints: [] } });
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks'] = '';
  fs.files['./docs/tasks/TASK-012.md'] = '## TASK-012: Test\n**Meta:** P2 | S | REVIEW | Focus:yes | 7-operations | local | none\n\n- [x] done\n';
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';

  const git = new MockGitRepository();
  const checker = new DriftChecker(fs as any, git as any, '.', '0.6.0');
  const results = await checker.check();

  const check = results.find(r => r.check === 'FocusStatusAlignment');
  assert.ok(check, 'FocusStatusAlignment check must exist');
  assert.equal(check.status, 'OK', 'REVIEW + Focus:yes should be permitted');
});

// ── arch task next --verify tests ──────────────────────────────────────────

test('arch task next --verify — all passing cmd predicates emits PRE-IMPL warning', async () => {
  const taskWithCmdAC = {
    id: 'TASK-020',
    title: 'Test task',
    status: 'READY',
    priority: 'P2',
    size: 'S',
    class: '7-operations',
    cli: 'local',
    context: ['none'],
    focus: true,
    depends: [],
    content: `## TASK-020: Test\n**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] echo works\n  - \`cmd: echo ok; exit: 0\`\n`,
    rawMetaLine: '',
    sprint: '',
    filePath: 'docs/tasks/TASK-020.md',
  };

  const taskRepo = new MockTaskRepository([taskWithCmdAC as any]);
  const fs = new MockFileSystem();
  // No INBOX timestamp — freshness check passes
  const command = new NextCommand(taskRepo as any, ['--verify'], undefined, fs as any, '.');

  // Capture stderr
  const stderrChunks: string[] = [];
  const origWrite = process.stderr.write.bind(process.stderr);
  (process.stderr as any).write = (chunk: string) => { stderrChunks.push(chunk); return true; };

  try {
    await command.execute();
  } finally {
    (process.stderr as any).write = origWrite;
  }

  const stderr = stderrChunks.join('');
  assert.ok(stderr.includes('[PRE-IMPL]'), `expected PRE-IMPL in stderr, got: ${stderr}`);
  assert.ok(stderr.includes('TASK-020'), `expected task id in stderr, got: ${stderr}`);
});

test('arch task next --verify — task with failing cmd predicate emits no PRE-IMPL warning', async () => {
  const taskWithFailingAC = {
    id: 'TASK-021',
    title: 'Failing task',
    status: 'READY',
    priority: 'P2',
    size: 'S',
    class: '7-operations',
    cli: 'local',
    context: ['none'],
    focus: true,
    depends: [],
    content: `## TASK-021: Failing\n**Meta:** P2 | S | READY | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] always fails\n  - \`cmd: exit 1; exit: 0\`\n`,
    rawMetaLine: '',
    sprint: '',
    filePath: 'docs/tasks/TASK-021.md',
  };

  const taskRepo = new MockTaskRepository([taskWithFailingAC as any]);
  const fs = new MockFileSystem();
  const command = new NextCommand(taskRepo as any, ['--verify'], undefined, fs as any, '.');

  const stderrChunks: string[] = [];
  const origWrite = process.stderr.write.bind(process.stderr);
  (process.stderr as any).write = (chunk: string) => { stderrChunks.push(chunk); return true; };

  try {
    await command.execute();
  } finally {
    (process.stderr as any).write = origWrite;
  }

  const stderr = stderrChunks.join('');
  assert.ok(!stderr.includes('[PRE-IMPL]'), `should NOT have PRE-IMPL in stderr, got: ${stderr}`);
});
