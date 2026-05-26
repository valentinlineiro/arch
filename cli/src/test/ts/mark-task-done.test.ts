import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';
import { Reviewer, ReviewResult } from '../../main/ts/domain/services/reviewer.js';
import { TrustedMetrics } from '../../main/ts/application/use-cases/compute-trusted-metrics.js';
import { MockFileSystem } from './mocks/index.js';

const validHansei = {
  severity: 'H1' as const,
  category: '[TypeHack]' as const,
  decision: 'Used any cast to bypass complex type circular dependency in parseTask (task-repository.ts).',
  constraint: 'P1 deadline and lack of specialized domain provider at the time.',
  cost: 'Type safety is degraded specifically in the parseTask method — src/repositories/task-repository.ts.',
  forwardAction: 'None scheduled. TASK-031 resolved. Monitor parseTask for recurrence.',
};

function makeTask(overrides: Partial<Task> = {}): Task {
  const base: Task = {
    id: 'TASK-031',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    sprint: 'Sprint 3',
    class: '2-code-generation',
    cli: 'claude-code',
    context: ['src/'],
    acceptanceCriteria: [],
    rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Sprint 3 | 2-code-generation | claude-code | src/',
    hansei: validHansei,
  };
  return { ...base, ...overrides };
  return {
    id: 'TASK-031',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    sprint: 'Sprint 3',
    class: '2-code-generation',
    cli: 'claude-code',
    context: ['src/'],
    acceptanceCriteria: [],
    rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Sprint 3 | 2-code-generation | claude-code | src/',
    hansei: validHansei,
    ...overrides,
  };
}

class MockTaskRepository implements TaskRepository {
  saved: Task | null = null;
  private task: Task | null;

  constructor(task: Task | null) {
    this.task = task;
  }

  async getById(id: string) { return this.task?.id === id ? this.task : null; }
  async getAll() { return this.task ? [this.task] : []; }
  async getActive() { return this.task ? [this.task] : []; }
  async findReady() { return []; }
  async getNextId() { return 'TASK-001'; }
  async parseTask(_content: string): Promise<Task | null> { return null; }
  async save(task: Task) { this.saved = task; }
}


function makeFs(): MockFileSystem {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ version: '0.2.0', hanseiSinceTaskId: 195 });
  return fs;
}

function makeReviewer(result: ReviewResult): Reviewer {
  const reviewer = new Reviewer();
  reviewer.reviewTask = () => result;
  return reviewer;
}

test('MarkTaskDone - sets status to DONE', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - throws when task not found', async () => {
  const repo = new MockTaskRepository(null);
  const useCase = new MarkTaskDone(repo, new Reviewer(), makeFs());

  await assert.rejects(
    () => useCase.execute('TASK-999'),
    /TASK-999 not found/
  );
});

test('MarkTaskDone - works from REVIEW status', async () => {
  const task = makeTask({ status: TaskStatus.REVIEW });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - blocks transition when pending ACs exist', async () => {
  const task = makeTask({
    acceptanceCriteria: [
      { description: 'AC one', completed: true },
      { description: 'AC two', completed: false },
    ],
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, new Reviewer(), makeFs());

  await assert.rejects(
    () => useCase.execute('TASK-031'),
    /Cannot mark TASK-031 as DONE/
  );
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskDone - force bypasses pending AC guard', async () => {
  const task = makeTask({
    acceptanceCriteria: [
      { description: 'AC one', completed: false },
    ],
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, new Reviewer(), makeFs());

  await useCase.execute('TASK-031', true);

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - injects closedAt timestamp on DONE transition', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-031');

  assert.ok(repo.saved?.closedAt, 'closedAt should be set');
  assert.ok(!isNaN(Date.parse(repo.saved!.closedAt!)), 'closedAt should be a valid ISO date');
});

test('MarkTaskDone - does not overwrite existing closedAt (idempotent)', async () => {
  const existing = '2026-01-01T00:00:00.000Z';
  const task = makeTask({ closedAt: existing });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-031');

  assert.strictEqual(repo.saved?.closedAt, existing);
});

test('MarkTaskDone - force path also injects closedAt', async () => {
  const task = makeTask({ acceptanceCriteria: [{ description: 'AC', completed: false }] });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, new Reviewer(), makeFs());

  await useCase.execute('TASK-031', true);

  assert.ok(repo.saved?.closedAt, 'closedAt should be set even on force');
});

test('MarkTaskDone - blocks post-rollout M task without Hansei section', async () => {
  const task = makeTask({
    id: 'TASK-195',
    size: 'M',
    content: '## TASK-195: Test Task\n**Meta:** P1 | M | REVIEW | Focus:no | 2-code-generation | claude-code | src/\n',
    status: TaskStatus.REVIEW,
    hansei: undefined,
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await assert.rejects(
    () => useCase.execute('TASK-195'),
    /Hansei required/
  );
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskDone - XS post-rollout task without Hansei section proceeds without error', async () => {
  const task = makeTask({
    id: 'TASK-195',
    size: 'XS',
    content: '## TASK-195: Test Task\n**Meta:** P1 | XS | REVIEW | Focus:no | 7-operations | claude | none\n',
    status: TaskStatus.REVIEW,
    hansei: undefined,
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-195');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - S post-rollout task without Hansei section proceeds without error', async () => {
  const task = makeTask({
    id: 'TASK-195',
    size: 'S',
    content: '## TASK-195: Test Task\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude | src/\n',
    status: TaskStatus.REVIEW,
    hansei: undefined,
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-195');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - allows pre-rollout task without Hansei section', async () => {
  const task = makeTask({
    id: 'TASK-194',
    content: '## TASK-194: Test Task\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude-code | src/\n',
    status: TaskStatus.REVIEW,
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-194');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

test('MarkTaskDone - allows post-rollout task with Hansei section', async () => {
  const task = makeTask({
    id: 'TASK-195',
    content: '## TASK-195: Test Task\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude-code | src/\n',
    status: TaskStatus.REVIEW,
    hansei: validHansei,
  });
  const repo = new MockTaskRepository(task);
  const useCase = new MarkTaskDone(repo, makeReviewer({ valid: true, violations: [] }), makeFs());

  await useCase.execute('TASK-195');

  assert.strictEqual(repo.saved?.status, TaskStatus.DONE);
});

// ── L3 Self-Archive Tests ──────────────────────────────────────────────────

import { DeterministicACVerifier } from '../../main/ts/domain/services/deterministic-ac-verifier.js';

const XS_TASK_WITH_CMD_AC = makeTask({
  id: 'TASK-200',
  size: 'XS',
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-200: XS with cmd AC\n**Meta:** P2 | XS | IN_PROGRESS | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] echo passes\n  - \`cmd: echo ok; exit: 0\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test.\n**Constraint:** None — test only.\n**Cost:** No cost introduced.\n**Forward Action:** None required.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test task for L3 gate verification purposes only.', constraint: 'No constraint — this is a unit test fixture task.', cost: 'No cost introduced by this test fixture task.', forwardAction: 'No forward action required for test fixture.' },
});

const M_TASK_WITH_CMD_AC = makeTask({
  id: 'TASK-201',
  size: 'M',
  class: '2-code-generation',
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-201: M with cmd AC (2-code-generation — not L3 eligible)\n**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | local | none\n\n### Acceptance Criteria\n- [ ] echo passes\n  - \`cmd: echo ok; exit: 0\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test fixture for L3 gate — AC1 (cmd: echo ok) passes cleanly.\n**Constraint:** No constraint — unit test fixture for TASK-201.\n**Cost:** No cost introduced by this test fixture task.\n**Forward Action:** No forward action required for test fixture.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test fixture for L3 gate — AC1 (cmd: echo ok) passes cleanly.', constraint: 'No constraint — unit test fixture for TASK-201.', cost: 'No cost introduced by this test fixture task.', forwardAction: 'No forward action required for test fixture.' },
});

const S_TASK_FAILING_CMD = makeTask({
  id: 'TASK-202',
  size: 'S',
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-202: S with failing cmd\n**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] always fails\n  - \`cmd: exit 1; exit: 0\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test.\n**Constraint:** None — test only.\n**Cost:** No cost introduced.\n**Forward Action:** None required.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test task for L3 gate verification purposes only.', constraint: 'No constraint — this is a unit test fixture task.', cost: 'No cost introduced by this test fixture task.', forwardAction: 'No forward action required for test fixture.' },
});

const S_TASK_PROSE_ONLY = makeTask({
  id: 'TASK-203',
  size: 'S',
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-203: S prose only\n**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] human verifies\n  - \`prose: verified manually\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test.\n**Constraint:** None — test only.\n**Cost:** No cost introduced.\n**Forward Action:** None required.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test task for L3 gate verification purposes only.', constraint: 'No constraint — this is a unit test fixture task.', cost: 'No cost introduced by this test fixture task.', forwardAction: 'No forward action required for test fixture.' },
});

function makeMockReviewer(valid = true): Reviewer {
  return { reviewTask: () => ({ valid, violations: [] }), validateCommitMessage: () => ({ valid: true, violations: [] }) } as any;
}

function makeMockFs(config?: object): MockFileSystem {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify(config ?? { hanseiSinceTaskId: 1 });
  fs.files['docs/INBOX.md'] = '# INBOX\n';
  return fs;
}

test('L3 gate — XS task with passing cmd AC qualifies for self-archive', async () => {
  const repo = new MockTaskRepository(XS_TASK_WITH_CMD_AC);
  const fs = makeMockFs();
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined);

  await useCase.execute('TASK-200');
  assert.equal(repo.saved?.status, TaskStatus.DONE, 'task should be DONE');
  
  // Check INBOX was written with L3-AUTO marker
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(inbox.includes('[L3-AUTO]'), `INBOX should contain L3-AUTO marker, got: ${inbox.slice(0, 200)}`);
  assert.ok(inbox.includes('AWAITING_REVIEW'), `INBOX should contain AWAITING_REVIEW, got: ${inbox.slice(0, 200)}`);
});

test('L3 gate — M task fails gate, no L3-AUTO in INBOX', async () => {
  const repo = new MockTaskRepository(M_TASK_WITH_CMD_AC);
  const fs = makeMockFs();
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined);

  await useCase.execute('TASK-201');
  assert.equal(repo.saved?.status, TaskStatus.DONE);
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(!inbox.includes('[L3-AUTO]'), 'M task should NOT get L3-AUTO');
});

test('L3 gate — S task with failing cmd AC is blocked before DONE', async () => {
  const repo = new MockTaskRepository(S_TASK_FAILING_CMD);
  const fs = makeMockFs();
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined);

  await assert.rejects(
    () => useCase.execute('TASK-202'),
    (err: Error) => {
      assert.ok(err.message.includes('AC verification failed'), `got: ${err.message}`);
      return true;
    }
  );
});

test('L3 gate — S prose-only task falls back to human review (no L3-AUTO)', async () => {
  const repo = new MockTaskRepository(S_TASK_PROSE_ONLY);
  const fs = makeMockFs();
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined);

  await useCase.execute('TASK-203');
  assert.equal(repo.saved?.status, TaskStatus.DONE);
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(!inbox.includes('[L3-AUTO]'), 'prose-only task should NOT get L3-AUTO');
});

// ── Turn Count Recording Tests ─────────────────────────────────────────────

test('MarkTaskDone — computes turn count from git log when lockedCommit present', async () => {
  const task = makeTask({
    id: 'TASK-500',
    status: TaskStatus.IN_PROGRESS,
    lockedCommit: 'abc1234',
    hansei: {
      severity: 'H0' as any,
      category: '[AuditGap]',
      decision: 'Turn count recording test task — verified during implementation.',
      constraint: 'No constraint — this is a unit test fixture task.',
      cost: 'No cost introduced by this test fixture task.',
      forwardAction: 'No forward action required for test fixture.',
    },
  });

  let savedTask: any = null;
  const repo = {
    getById: async () => task,
    save: async (t: any) => { savedTask = t; },
  };
  const fs = {
    readFile: async (p: string) => {
      if (p === 'arch.config.json') return JSON.stringify({ hanseiSinceTaskId: 1 });
      if (p === 'docs/INBOX.md') return '# INBOX\n';
      throw new Error(`Not found: ${p}`);
    },
    writeFile: async () => {},
    exists: async () => true,
  };
  const reviewer = {
    reviewTask: () => ({ valid: true, violations: [] }),
    validateCommitMessage: () => ({ valid: true, violations: [] }),
  };
  const git = {
    getCommitCountBetween: async (fromHash: string) => 7,
  };

  const useCase = new MarkTaskDone(repo as any, reviewer as any, fs as any, undefined, undefined, undefined, undefined, git as any);
  await useCase.execute('TASK-500');

  assert.equal(savedTask?.turns, 7, 'turns should be 7 (mocked git count)');
});

test('MarkTaskDone — turns is null when lockedCommit absent', async () => {
  const task = makeTask({
    id: 'TASK-501',
    status: TaskStatus.IN_PROGRESS,
    lockedCommit: undefined,
    hansei: {
      severity: 'H0' as any,
      category: '[AuditGap]',
      decision: 'No lockedCommit test — turns should remain null.',
      constraint: 'No constraint — this is a unit test fixture task.',
      cost: 'No cost introduced by this test fixture task.',
      forwardAction: 'No forward action required for test fixture.',
    },
  });

  let savedTask: any = null;
  const repo = {
    getById: async () => task,
    save: async (t: any) => { savedTask = t; },
  };
  const fs = {
    readFile: async (p: string) => {
      if (p === 'arch.config.json') return JSON.stringify({ hanseiSinceTaskId: 1 });
      if (p === 'docs/INBOX.md') return '# INBOX\n';
      throw new Error(`Not found: ${p}`);
    },
    writeFile: async () => {},
    exists: async () => true,
  };
  const reviewer = {
    reviewTask: () => ({ valid: true, violations: [] }),
    validateCommitMessage: () => ({ valid: true, violations: [] }),
  };
  const git = {
    getCommitCountBetween: async () => 5,
  };

  const useCase = new MarkTaskDone(repo as any, reviewer as any, fs as any, undefined, undefined, undefined, undefined, git as any);
  await useCase.execute('TASK-501');

  assert.equal(savedTask?.turns ?? null, null, 'turns should be null when no lockedCommit');
});

// ── Causal Signal Auto-Emission Tests ────────────────────────────────────────

class MockCausalSignalLog {
  appended: object[] = [];
  async append(params: object) { this.appended.push(params); return params; }
  async pending() { return []; }
  async all() { return []; }
  async updateStatuses() {}
}

test('MarkTaskDone — auto-emits implements signal for explicit ADR reference in content', async () => {
  const task = makeTask({
    id: 'TASK-600',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    content: `## TASK-600\n**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude | none\n\n### Context\nImplements ADR-015 and **ADR:** ADR-014.\n\n## Hansei\n**Severity:** H0\n**Category:** [SpecDrift]\n**Decision:** Causal signal auto-emission test.\n**Constraint:** None — test only.\n**Cost:** No cost.\n**Forward Action:** None.\n`,
    hansei: { severity: 'H0', category: '[SpecDrift]', decision: 'Causal signal auto-emission test — verified ADR detection.', constraint: 'No constraint applies — this is a unit test fixture task.', cost: 'No cost introduced by this test fixture.', forwardAction: 'No forward action required for test fixture.' },
    depends: [],
  });
  const repo = new MockTaskRepository(task);
  const fs = makeMockFs();
  const causalLog = new MockCausalSignalLog();

  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, causalLog as any);
  await useCase.execute('TASK-600');

  const implementsSignals = causalLog.appended.filter((s: any) => s.candidate_relation === 'implements');
  const adrTargets = implementsSignals.map((s: any) => s.candidate_to);
  assert.ok(adrTargets.includes('ADR-015'), `should emit for bare ADR-015, got: ${JSON.stringify(adrTargets)}`);
  assert.ok(adrTargets.includes('ADR-014'), `should emit for **ADR:** ADR-014, got: ${JSON.stringify(adrTargets)}`);
  assert.ok(implementsSignals.every((s: any) => s.confidence === 0.5), 'implements confidence should be 0.5');
  assert.ok(implementsSignals.every((s: any) => s.event === 'task_completed:TASK-600'), 'event should be task_completed:TASK-600');
});

test('MarkTaskDone — auto-emits caused_by signal for each TASK-ID in depends', async () => {
  const task = makeTask({
    id: 'TASK-601',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    content: `## TASK-601\n**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude | none\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Depends signal test.\n**Constraint:** None.\n**Cost:** None.\n**Forward Action:** None.\n`,
    hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Depends signal auto-emission test — verified caused_by extraction.', constraint: 'No constraint applies — this is a unit test fixture task.', cost: 'No cost introduced by this test fixture.', forwardAction: 'No forward action required for test fixture.' },
    depends: ['TASK-100', 'TASK-200'],
  });
  const repo = new MockTaskRepository(task);
  const fs = makeMockFs();
  const causalLog = new MockCausalSignalLog();

  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, causalLog as any);
  await useCase.execute('TASK-601');

  const causedBySignals = causalLog.appended.filter((s: any) => s.candidate_relation === 'caused_by');
  const targets = causedBySignals.map((s: any) => s.candidate_to);
  assert.ok(targets.includes('TASK-100'), `should emit caused_by for TASK-100, got: ${JSON.stringify(targets)}`);
  assert.ok(targets.includes('TASK-200'), `should emit caused_by for TASK-200, got: ${JSON.stringify(targets)}`);
  assert.ok(causedBySignals.every((s: any) => s.confidence === 0.5), 'caused_by confidence should be 0.5');
});

test('MarkTaskDone — no signals emitted for empty content and no depends', async () => {
  const task = makeTask({
    id: 'TASK-602',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    content: `## TASK-602\n**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 7-operations | claude | none\n`,
    hansei: undefined,
    depends: [],
  });
  const repo = new MockTaskRepository(task);
  const fs = makeMockFs();
  const causalLog = new MockCausalSignalLog();

  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, causalLog as any);
  await useCase.execute('TASK-602');

  assert.equal(causalLog.appended.length, 0, `should emit no signals, got: ${JSON.stringify(causalLog.appended)}`);
});

// ── L3 gate extension: M tasks in 6-writing / 7-operations ───────────────

class MockGitRepository {
  constructor(public changedFiles: string[] = []) {}
  async getChangedFilesInLastCommit() { return this.changedFiles; }
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
  async getMergeCommits() { return []; }
  async getStagedFiles() { return []; }
  async getModifiedFiles() { return []; }
  async getRepoRoot() { return '.'; }
  async getFileFirstCommitDate() { return null; }
  async getLastCommitHash() { return null; }
  async getCommitCountBetween() { return null; }
  async isValidCommitHash() { return false; }
  async getCommitAuthor() { return null; }
  async getCommitHistory() { return []; }
}

const M_6WRITING_ALL_CMD = makeTask({
  id: 'TASK-210',
  size: 'M',
  class: '6-writing',
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-210: M in 6-writing, all cmd: ACs\n**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 6-writing | local | none\n\n### Acceptance Criteria\n- [ ] echo passes\n  - \`cmd: echo ok; exit: 0\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test fixture for L3 extended gate — AC1 (cmd: echo ok) uses cmd predicate.\n**Constraint:** No constraint — unit test fixture for TASK-210.\n**Cost:** No cost introduced by this test fixture.\n**Forward Action:** No forward action required for test fixture TASK-210.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test fixture for L3 extended gate — AC1 (cmd: echo ok) uses cmd predicate.', constraint: 'No constraint — unit test fixture for TASK-210.', cost: 'No cost introduced by this test fixture.', forwardAction: 'No forward action required for test fixture TASK-210.' },
});

const M_7OPS_PROSE_AC = makeTask({
  id: 'TASK-211',
  size: 'M',
  class: '7-operations',
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-211: M in 7-operations, has prose AC — not L3 eligible\n**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] human verifies\n  - \`prose: verified manually\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test fixture for L3 prose-blocks-M gate — AC1 uses prose: verified.\n**Constraint:** No constraint — unit test fixture for TASK-211.\n**Cost:** No cost introduced by this test fixture.\n**Forward Action:** No forward action required for test fixture TASK-211.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test fixture for L3 prose-blocks-M gate — AC1 uses prose: verified.', constraint: 'No constraint — unit test fixture for TASK-211.', cost: 'No cost introduced by this test fixture.', forwardAction: 'No forward action required for test fixture TASK-211.' },
});

test('L3 gate — M task in 6-writing with all cmd: ACs qualifies for self-archive', async () => {
  const repo = new MockTaskRepository(M_6WRITING_ALL_CMD);
  const fs = makeMockFs({ hanseiSinceTaskId: 1, governance: { protectedPaths: ['docs/adr/'] } });
  const git = new MockGitRepository([]);
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined, git as any);

  await useCase.execute('TASK-210');
  assert.equal(repo.saved?.status, TaskStatus.DONE);
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(inbox.includes('[L3-AUTO]'), `M 6-writing should get L3-AUTO, INBOX: ${inbox.slice(0, 300)}`);
});

test('L3 gate — M task in 6-writing with prose AC is NOT L3 eligible', async () => {
  const repo = new MockTaskRepository(M_7OPS_PROSE_AC);
  const fs = makeMockFs({ hanseiSinceTaskId: 1, governance: { protectedPaths: [] } });
  const git = new MockGitRepository([]);
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined, git as any);

  await useCase.execute('TASK-211');
  assert.equal(repo.saved?.status, TaskStatus.DONE);
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(!inbox.includes('[L3-AUTO]'), 'M task with prose AC should NOT get L3-AUTO');
});

test('L3 gate — M task in 2-code-generation is NOT L3 eligible', async () => {
  const repo = new MockTaskRepository(M_TASK_WITH_CMD_AC);
  const fs = makeMockFs({ hanseiSinceTaskId: 1, governance: { protectedPaths: [] } });
  const git = new MockGitRepository([]);
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined, git as any);

  await useCase.execute('TASK-201');
  assert.equal(repo.saved?.status, TaskStatus.DONE);
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(!inbox.includes('[L3-AUTO]'), '2-code-generation M task should NOT get L3-AUTO');
});

test('L3 gate — M task in 6-writing with protected path modified is NOT L3 eligible', async () => {
  const repo = new MockTaskRepository(M_6WRITING_ALL_CMD);
  const fs = makeMockFs({ hanseiSinceTaskId: 1, governance: { protectedPaths: ['cli/src/main/ts/domain/models/'] } });
  const git = new MockGitRepository(['cli/src/main/ts/domain/models/task.ts']);
  const useCase = new MarkTaskDone(repo, makeMockReviewer(), fs, undefined, undefined, undefined, undefined, git as any);

  await useCase.execute('TASK-210');
  assert.equal(repo.saved?.status, TaskStatus.DONE);
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(!inbox.includes('[L3-AUTO]'), 'M task with protected path modified should NOT get L3-AUTO');
});
