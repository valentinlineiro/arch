import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { Task, TaskStatus } from '../../main/ts/domain/models/task.js';
import { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';
import { Reviewer, ReviewResult } from '../../main/ts/domain/services/reviewer.js';
import { MockFileSystem } from './mocks/index.js';

const validHansei = {
  severity: 'H1',
  category: '[TypeHack]',
  decision: 'Used any cast to bypass complex type circular dependency in repository.',
  constraint: 'P1 deadline and lack of specialized domain provider at the time.',
  cost: 'Type safety is degraded specifically in the parseTask method.',
  forwardAction: 'none',
};

function makeTask(overrides: Partial<Task> = {}): Task {
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

test('MarkTaskDone - blocks post-rollout task without Hansei section', async () => {
  const task = makeTask({
    id: 'TASK-195',
    content: '## TASK-195: Test Task\n**Meta:** P1 | S | REVIEW | Focus:no | 2-code-generation | claude-code | src/\n',
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
  status: TaskStatus.IN_PROGRESS,
  content: `## TASK-201: M with cmd AC\n**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 7-operations | local | none\n\n### Acceptance Criteria\n- [ ] echo passes\n  - \`cmd: echo ok; exit: 0\`\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Test.\n**Constraint:** None — test only.\n**Cost:** No cost introduced.\n**Forward Action:** None required.\n`,
  hansei: { severity: 'H0', category: '[AuditGap]', decision: 'Test task for L3 gate verification purposes only.', constraint: 'No constraint — this is a unit test fixture task.', cost: 'No cost introduced by this test fixture task.', forwardAction: 'No forward action required for test fixture.' },
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
