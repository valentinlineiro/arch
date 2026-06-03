import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MarkTaskInProgress, DefinitionOfReadyError } from '../../main/ts/application/use-cases/mark-task-in-progress.js';
import { DriftChecker } from '../../main/ts/application/use-cases/drift-checker.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import type { Task } from '../../main/ts/domain/models/task.js';

// ── Shared Mocks ────────────────────────────────────────────────────────────

class TestFileSystem {
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

class TestTaskRepository {
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

class TestGitRepository {
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
  const fs = new TestFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({
    governance: { protectedPaths: ['docs/guidelines/'], negativeConstraints: [] },
  });
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks/TASK-001.md'] = makeTask().content;
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';
  fs.files['./docs/guidelines/core.md'] = '';

  const git = new TestGitRepository();
  // Simulating: docs/guidelines/core.md modified, no ADR added
  git.lastCommitFiles = ['docs/guidelines/core.md'];
  git.statusLines = ['M  docs/guidelines/core.md'];

  const taskRepo = new TestTaskRepository([makeTask()]);

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

  const taskRepo = new TestTaskRepository([malformedTask]);
  const markInProgress = new MarkTaskInProgress(taskRepo as any);

  await assert.rejects(
    () => markInProgress.execute('TASK-002', 'cli'),
    (err: Error) => {
      assert.ok(err instanceof DefinitionOfReadyError, `expected DefinitionOfReadyError, got ${err.constructor.name}`);
      assert.ok(err.reasons.some(r => r.toLowerCase().includes('class')), `expected class violation, got: ${err.reasons}`);
      return true;
    }
  );
});

// ── Scenario (c): Stale INBOX blocks arch task next ──────────────────────

// E5 (c) — stale INBOX check: removed in TASK-930. NextCommand no longer reads INBOX
// for freshness. The stale-INBOX halt was an INBOX invariant violation (machine reading
// a human-only surface). No structured-store equivalent; the check was removed.

// ── Scenario: Unresolved halt in HALT-LOG causes HaltPolicy WARN ──────────

test('EscalationMaturity E5 — unresolved halt entry causes HaltPolicy WARN', async () => {
  const fs = new TestFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({
    governance: { protectedPaths: [], negativeConstraints: [] },
  });
  // HALT-LOG row with empty Resolution column
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n| 2026-05-16T10:00:00Z | ANDON_HALT | TASK-100 | Protected path edit | |\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks/TASK-001.md'] = makeTask().content;
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';

  const git = new TestGitRepository();
  const taskRepo = new TestTaskRepository([makeTask()]);

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
  const fs = new TestFileSystem();
  fs.files['./arch.config.json'] = JSON.stringify({ governance: { protectedPaths: [], negativeConstraints: [] } });
  fs.files['./docs/HALT-LOG.md'] = '# Halt Log\n| Timestamp | Type | Task ID | Reason | Resolution |\n|---|---|---|---|---|\n';
  fs.files['./docs/HALT.md'] = '| Condition | Trigger command | CLI exit code | HALT-LOG entry format |\n|---|---|---|---|\n| test | test | 1 | test |\n';
  fs.files['./docs/tasks'] = '';
  fs.files['./docs/tasks/TASK-010.md'] = '## TASK-010: Test\n**Meta:** P2 | S | IN_PROGRESS | Focus:no | 7-operations | local | none\n\n- [x] done\n';
  fs.files['./docs/TASK-FORMAT.md'] = '';
  fs.files['./.arch/focus-ledger.jsonl'] = '';

  const git = new TestGitRepository();
  const checker = new DriftChecker(fs as any, git as any, '.', '0.6.0');
  const results = await checker.check();

  const check = results.find(r => r.check === 'FocusStatusAlignment');
  assert.ok(check, 'FocusStatusAlignment check must exist');
  assert.equal(check.status, 'WARN');
  assert.ok(check.details.some(d => d.includes('IN_PROGRESS') && d.includes('Focus:NONE')));
});

