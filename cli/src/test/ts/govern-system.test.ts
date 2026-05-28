import { test } from 'node:test';
import assert from 'node:assert';
import { GovernSystem } from '../../main/ts/application/use-cases/govern-system.js';
import { TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { parseLedger } from '../../main/ts/application/use-cases/focus-ledger.js';
import { MockFileSystem, MockGitRepository } from './mocks/index.js';

const TASK_META_READY_NO = `**Meta:** P2 | S | READY | Focus:no | 6-writing | local | docs/`;
const TASK_META_READY_YES = `**Meta:** P2 | S | READY | Focus:yes | 6-writing | local | docs/`;
const TASK_META_P1_NO = `**Meta:** P1 | S | READY | Focus:no | 6-writing | local | docs/`;

const CONFIG = JSON.stringify({
  version: '0.6.0',
  minTicksBeforeSwitch: 2,
  governance: { conductEveryN: 3 },
  hanseiSinceTaskId: 195,
});

function makeTask(id: string, priority = 'P2', status = TaskStatus.READY, focus = false) {
  const focusStr = focus ? 'Focus:yes' : 'Focus:no';
  const focusLevel = focus ? FocusLevel.HIGH : FocusLevel.NONE;
  const rawMeta = `**Meta:** ${priority} | S | ${status} | ${focusStr} | 6-writing | local | docs/`;
  return {
    id,
    title: `Task ${id}`,
    priority,
    size: 'S',
    status,
    focus: focusLevel,
    sprint: '',
    class: '6-writing',
    cli: 'local',
    context: [],
    acceptanceCriteria: [],
    rawMetaLine: rawMeta,
    depends: undefined,
    content: `## ${id}: Title\n${rawMeta}\n`,
    filePath: `docs/tasks/${id}.md`,
  };
}

function makeFs(extraFiles: Record<string, string> = {}, dirs: Record<string, string[]> = {}): MockFileSystem {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = CONFIG;
  Object.assign(fs.files, extraFiles);
  Object.assign(fs.dirs, dirs);
  return fs;
}

class SpyTaskRepository {
  constructor(private tasks: any[] = []) {}

  async getById(id: string) { return this.tasks.find(t => t.id === id) ?? null; }
  async getAll() { return this.tasks; }
  // getActive mirrors the real repo: returns all tasks in docs/tasks/ (including DONE, not yet archived)
  async getActive() { return this.tasks; }
  async findReady() { return this.tasks.filter(t => t.status === TaskStatus.READY); }
  async save() {}
  async getNextId() { return 'TASK-099'; }
  async parseTask() { return null; }
}

// ─── No-focus assignment ──────────────────────────────────────────────────────

test('assigns focus to top eligible task when no focus exists', async () => {
  const task = makeTask('TASK-042', 'P2');
  const fs = makeFs({ 'docs/tasks/TASK-042.md': task.content });
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(fs.files['docs/tasks/TASK-042.md'].includes('Focus:yes'), 'task file must have Focus:yes');
  assert.ok(git.commitCalls.some(m => m.includes('TASK-042') && m.includes('FOCUS_ACQUIRED')), 'must commit FOCUS_ACQUIRED');

  const ledgerContent = fs.files['.arch/focus-ledger.jsonl'];
  assert.ok(ledgerContent, 'ledger must be written');
  const ledger = parseLedger(ledgerContent);
  assert.strictEqual(ledger.lastCommittedTick, 1);
  const ruling = ledger.rulings.find(r => r.action === 'FOCUS_ACQUIRED' && r.taskId === 'TASK-042');
  assert.ok(ruling, 'ledger must contain FOCUS_ACQUIRED ruling');
});

test('no focus assignment when no eligible tasks', async () => {
  const task = makeTask('TASK-042', 'P2', TaskStatus.BLOCKED);
  const fs = makeFs();
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(!fs.files['docs/tasks/TASK-042.md']?.includes('Focus:yes'), 'blocked task must not get focus');
});

// ─── Inercia window preservation ─────────────────────────────────────────────

test('preserves focus within inercia window when higher-priority task exists', async () => {
  const p2task = makeTask('TASK-042', 'P2', TaskStatus.READY, true);
  const p1task = makeTask('TASK-043', 'P1', TaskStatus.READY, false);

  // Ledger: TASK-042 acquired at tick 1, lastCommittedTick = 1
  // nextTick = 2, ticksSinceAcquired = 2 - 1 = 1 < minTicksBeforeSwitch(2) → preserve
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 1 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-042', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'docs/tasks/TASK-042.md': p2task.content,
    'docs/tasks/TASK-043.md': p1task.content,
    '.arch/focus-ledger.jsonl': ledgerContent,
  });

  const repo = new SpyTaskRepository([p2task, p1task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(fs.files['docs/tasks/TASK-042.md'].includes('Focus:yes'), 'TASK-042 must remain focused (inercia window)');
  assert.ok(!fs.files['docs/tasks/TASK-043.md'].includes('Focus:yes'), 'TASK-043 must not get focus yet');

  const ledger = parseLedger(fs.files['.arch/focus-ledger.jsonl']);
  const preserved = ledger.rulings.find(r => r.action === 'FOCUS_PRESERVED' && r.taskId === 'TASK-042');
  assert.ok(preserved, 'ledger must record FOCUS_PRESERVED');
});

// ─── Priority preemption ──────────────────────────────────────────────────────

test('preempts lower-priority task after inercia window expires', async () => {
  const p2task = makeTask('TASK-042', 'P2', TaskStatus.READY, true);
  const p1task = makeTask('TASK-043', 'P1', TaskStatus.READY, false);

  // Ledger: TASK-042 acquired at tick 1, lastCommittedTick = 3
  // nextTick = 4, ticksSinceAcquired = 4 - 1 = 3 >= minTicksBeforeSwitch(2) → preempt
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 3 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-042', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
    JSON.stringify({ tick: 2, taskId: 'TASK-042', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T01:00:00Z' }),
    JSON.stringify({ tick: 3, taskId: 'TASK-042', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T02:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'docs/tasks/TASK-042.md': p2task.content,
    'docs/tasks/TASK-043.md': p1task.content,
    '.arch/focus-ledger.jsonl': ledgerContent,
  });

  const repo = new SpyTaskRepository([p2task, p1task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(fs.files['docs/tasks/TASK-043.md'].includes('Focus:yes'), 'TASK-043 (P1) must be focused after preemption');
  assert.ok(fs.files['docs/tasks/TASK-042.md'].includes('Focus:no'), 'TASK-042 (P2) must lose focus');

  const ledger = parseLedger(fs.files['.arch/focus-ledger.jsonl']);
  const ruling = ledger.rulings.find(r => r.action === 'FOCUS_ACQUIRED' && r.taskId === 'TASK-043');
  assert.ok(ruling, 'ledger must record FOCUS_ACQUIRED for TASK-043');
  assert.strictEqual(ruling?.previousTask, 'TASK-042');
});

// ─── Integrity fix ────────────────────────────────────────────────────────────

test('emits INTEGRITY_FIX and clears focus when Focus:yes has no acquisition ruling', async () => {
  const task = makeTask('TASK-042', 'P2', TaskStatus.READY, true);
  const fs = makeFs({
    'docs/tasks/TASK-042.md': task.content,
    '.arch/focus-ledger.jsonl': JSON.stringify({ meta: true, lastCommittedTick: 0 }) + '\n',
  });

  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const ledger = parseLedger(fs.files['.arch/focus-ledger.jsonl']);
  const fix = ledger.rulings.find(r => r.action === 'INTEGRITY_FIX' && r.taskId === 'TASK-042');
  assert.ok(fix, 'ledger must contain INTEGRITY_FIX ruling');

  // After integrity fix, Rule 2 fires: re-assign focus
  const acquired = ledger.rulings.find(r => r.action === 'FOCUS_ACQUIRED');
  assert.ok(acquired, 'focus must be re-assigned after integrity fix');
});

// ─── Eligibility filter ───────────────────────────────────────────────────────

test('blocked task (status BLOCKED) is not eligible for focus', async () => {
  const blocked = makeTask('TASK-042', 'P1', TaskStatus.BLOCKED);
  const ready = makeTask('TASK-043', 'P2', TaskStatus.READY);

  const fs = makeFs({
    'docs/tasks/TASK-042.md': blocked.content,
    'docs/tasks/TASK-043.md': ready.content,
  });

  const repo = new SpyTaskRepository([blocked, ready]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(!fs.files['docs/tasks/TASK-042.md'].includes('Focus:yes'), 'blocked task must not get focus');
  assert.ok(fs.files['docs/tasks/TASK-043.md'].includes('Focus:yes'), 'TASK-043 (READY) must get focus');
});

test('task with unresolved dependency is not eligible for focus', async () => {
  const dep = makeTask('TASK-001', 'P0', TaskStatus.READY);
  const task = { ...makeTask('TASK-042', 'P1', TaskStatus.READY), depends: ['TASK-001'] };

  const fs = makeFs({
    'docs/tasks/TASK-042.md': task.content,
    'docs/tasks/TASK-001.md': dep.content,
  });

  const repo = new SpyTaskRepository([task, dep]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  // TASK-042 has unresolved dep (TASK-001 is READY, not DONE), so TASK-001 should get focus
  const ledger = parseLedger(fs.files['.arch/focus-ledger.jsonl'] ?? '');
  const acquired = ledger.rulings.find(r => r.action === 'FOCUS_ACQUIRED');
  assert.notStrictEqual(acquired?.taskId, 'TASK-042', 'task with unresolved dep must not be selected');
});

// ─── Archival guard (existing behavior) ──────────────────────────────────────

test('archiveDoneTasks blocks auto-archiving post-rollout DONE task without Hansei', async () => {
  const task = {
    ...makeTask('TASK-195', 'P1', TaskStatus.DONE),
    rawMetaLine: '**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/',
  };
  const fs = makeFs({
    'docs/tasks/TASK-195.md': '## TASK-195: Missing Hansei\n**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/\n',
  });
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await assert.rejects(
    () => system.execute(),
    /missing ## Hansei section/
  );

  assert.strictEqual(git.commitCalls.some(m => m.includes('archive [TASK-195]')), false);
});

test('archiveDoneTasks appends ANDON_HALT to INBOX.md on Hansei violation', async () => {
  const task = {
    ...makeTask('TASK-195', 'P1', TaskStatus.DONE),
    rawMetaLine: '**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/',
  };
  const fs = makeFs({
    'docs/tasks/TASK-195.md': '## TASK-195: Missing Hansei\n**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/\n',
    'docs/INBOX.md': '# INBOX\n',
  });
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await assert.rejects(() => system.execute(), /missing ## Hansei section/);

  const inboxContent = fs.files['docs/INBOX.md'];
  assert.ok(inboxContent.includes('ANDON_HALT | TASK-195'), 'INBOX must contain ANDON_HALT');
  assert.ok(inboxContent.includes('Evidence: missing ## Hansei section'), 'INBOX must contain violation evidence');
});

// ─── Metrics refresh on govern tick ──────────────────────────────────────────

test('govern tick updates METRICS.md Trusted section', async () => {
  const task = makeTask('TASK-042', 'P2');
  const fs = makeFs({
    'docs/tasks/TASK-042.md': task.content,
    'docs/METRICS.md': [
      '# ARCH Metrics',
      '<!-- GENERATED:START -->',
      '## Operational Metrics',
      '',
      '*Last updated: 2026-01-01T00:00:00.000Z*',
      '',
      '### Trusted Metrics',
      '',
      '| Metric | Value | Notes |',
      '|--------|-------|-------|',
      '| **Completed Tasks** | 10 | total archived |',
      '| **REVIEW_FAIL Rate** | 0.0% | rejected / total review exits |',
      '',
      '### Cycle Time (P50/P90)',
      '',
      '| Size | P50 | P90 | Count |',
      '|------|-----|-----|-------|',
      '',
      '### Experimental Metrics',
      '',
      '> Confidence placeholder',
      '',
      '<!-- GENERATED:END -->',
    ].join('\n'),
  }, { 'docs/archive': ['T1.md', 'T2.md', 'T3.md'] });

  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const metricsContent = fs.files['docs/METRICS.md'];
  assert.ok(metricsContent.includes('| **Completed Tasks** | 3 | total archived |'), 'Completed Tasks must be updated to 3');
  assert.ok(metricsContent.includes('### Experimental Metrics'), 'Experimental section must be preserved');
});

test('govern tick continues when metrics refresh fails', async () => {
  const task = makeTask('TASK-042', 'P2');
  const fs = makeFs({ 'docs/tasks/TASK-042.md': task.content });
  // No METRICS.md — refresh will throw, but govern must not fail

  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  // Should not throw even though refresh will fail (METRICS.md missing)
  const result = await system.execute();
  assert.ok(result !== undefined, 'govern execute should return a result');
});

// ─── Deep analysis cadence check ─────────────────────────────────────────────

test('govern surfaces deep analysis due when cadence threshold reached', async () => {
  const task = makeTask('TASK-042', 'P2');

  // Seed ledger at tick 6
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 6 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-042', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'docs/tasks/TASK-042.md': task.content,
    '.arch/focus-ledger.jsonl': ledgerContent,
    '.arch/deep-analysis-state.json': JSON.stringify({ lastDeepRunTick: 1, lastDeepRunTimestamp: '2026-05-01T00:00:00Z' }),
  });

  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  const result = await system.execute();

  assert.ok(result.reasons.includes('deep-analysis-due'), 'reasons must include deep-analysis-due');
});

test('govern does not surface deep analysis due when within cadence window', async () => {
  const task = makeTask('TASK-042', 'P2');

  // Seed ledger at tick 4
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 4 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-042', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'docs/tasks/TASK-042.md': task.content,
    '.arch/focus-ledger.jsonl': ledgerContent,
    '.arch/deep-analysis-state.json': JSON.stringify({ lastDeepRunTick: 1, lastDeepRunTimestamp: '2026-05-01T00:00:00Z' }),
  });

  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  const result = await system.execute();

  assert.ok(!result.reasons.includes('deep-analysis-due'), 'reasons must NOT include deep-analysis-due when within window');
});

test('govern surfaces deep analysis due when weak signal is overdue', async () => {
  const task = makeTask('TASK-042', 'P2');

  const fs = makeFs({
    'docs/tasks/TASK-042.md': task.content,
    '.arch/focus-ledger.jsonl': JSON.stringify({ meta: true, lastCommittedTick: 2 }) + '\n',
    '.arch/deep-analysis-state.json': JSON.stringify({ lastDeepRunTick: 1, lastDeepRunTimestamp: '2026-05-14T00:00:00Z' }),
    'docs/tensions/weak-signals.md': '**Adjudicate by:** 2026-01-01 (past deadline)',
  });

  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  const result = await system.execute();

  assert.ok(result.reasons.includes('deep-analysis-due'), 'reasons must include deep-analysis-due from weak signal');
});

// ─── Uncommitted file leaks ───────────────────────────────────────────────────

function makeDoneTask(id: string) {
  const rawMeta = `**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/`;
  return {
    id,
    title: `Task ${id}`,
    priority: 'P2',
    size: 'S',
    status: TaskStatus.DONE,
    focus: FocusLevel.NONE,
    sprint: '',
    class: '6-writing',
    cli: 'local',
    context: [],
    acceptanceCriteria: [],
    rawMetaLine: rawMeta,
    depends: undefined,
    content: `## ${id}: Title\n${rawMeta}\n\n## Hansei\n**Severity:** H0\n**Category:** [AuditGap]\n**Decision:** Clean delivery with no issues.\n**Constraint:** No constraints encountered.\n**Cost:** No debt introduced.\n**Forward Action:** None.\n`,
    filePath: `docs/tasks/${id}.md`,
  };
}

test('govern stages focus-flag task file in the FOCUS_ACQUIRED commit', async () => {
  const task = makeTask('TASK-042', 'P2');
  const fs = makeFs({ 'docs/tasks/TASK-042.md': task.content });
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(
    git.addCalls.includes('docs/tasks/TASK-042.md'),
    'changed task file must be staged alongside ledger in the FOCUS_ACQUIRED commit'
  );
});

test('govern stages archived task file (including working-tree edits) in archive commit', async () => {
  const task = makeDoneTask('TASK-099');
  const fs = makeFs({
    'docs/tasks/TASK-099.md': task.content,
    '.arch/corpus-index.json': '{}',
  });
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(
    git.addCalls.includes('docs/archive/TASK-099.md'),
    'archive file must be staged (git add) after git mv so working-tree edits are captured'
  );
});

// ─── Stale IN_PROGRESS detection ─────────────────────────────────────────────

test('yields focus to READY task when IN_PROGRESS task exceeds stale threshold', async () => {
  // staleTaskThresholdTicks = 3, ticksSinceAcquired = 4 (acquired at tick 1, lastCommittedTick = 4)
  const staleConfig = JSON.stringify({
    version: '0.6.0',
    minTicksBeforeSwitch: 2,
    governance: { conductEveryN: 3, staleTaskThresholdTicks: 3 },
    hanseiSinceTaskId: 195,
  });

  const inProgress = makeTask('TASK-100', 'P2', TaskStatus.IN_PROGRESS, true);
  const ready = makeTask('TASK-101', 'P2', TaskStatus.READY, false);

  // Ledger: TASK-100 acquired at tick 1, lastCommittedTick = 4 → ticksSinceAcquired = 4 >= 3
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 4 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-100', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
    JSON.stringify({ tick: 2, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T01:00:00Z' }),
    JSON.stringify({ tick: 3, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T02:00:00Z' }),
    JSON.stringify({ tick: 4, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T03:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'arch.config.json': staleConfig,
    'docs/tasks/TASK-100.md': inProgress.content,
    'docs/tasks/TASK-101.md': ready.content,
    '.arch/focus-ledger.jsonl': ledgerContent,
  });

  const repo = new SpyTaskRepository([inProgress, ready]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  // Focus must shift to READY task
  assert.ok(fs.files['docs/tasks/TASK-101.md'].includes('Focus:yes'), 'READY task must gain focus after stale detection');
  assert.ok(!fs.files['docs/tasks/TASK-100.md'].includes('Focus:yes'), 'stale IN_PROGRESS task must lose focus');

  // INBOX must contain STALE_TASK entry
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(inbox.includes('[STALE_TASK] TASK-100'), 'INBOX must contain [STALE_TASK] TASK-100 entry');

  // Ledger must record FOCUS_ACQUIRED for TASK-101
  const ledger = parseLedger(fs.files['.arch/focus-ledger.jsonl']);
  const acquired = ledger.rulings.find(r => r.action === 'FOCUS_ACQUIRED' && r.taskId === 'TASK-101');
  assert.ok(acquired, 'ledger must record FOCUS_ACQUIRED for TASK-101');
  assert.strictEqual(acquired?.previousTask, 'TASK-100');
});

test('does not append duplicate STALE_TASK to INBOX when already present', async () => {
  const staleConfig = JSON.stringify({
    version: '0.6.0',
    minTicksBeforeSwitch: 2,
    governance: { conductEveryN: 3, staleTaskThresholdTicks: 3 },
    hanseiSinceTaskId: 195,
  });

  const inProgress = makeTask('TASK-100', 'P2', TaskStatus.IN_PROGRESS, true);

  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 4 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-100', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
    JSON.stringify({ tick: 2, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T01:00:00Z' }),
    JSON.stringify({ tick: 3, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T02:00:00Z' }),
    JSON.stringify({ tick: 4, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T03:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'arch.config.json': staleConfig,
    'docs/tasks/TASK-100.md': inProgress.content,
    'docs/INBOX.md': '\n## [2026-01-01 00:00] [STALE_TASK] TASK-100 | TASK-100\nEvidence: stale\n',
    '.arch/focus-ledger.jsonl': ledgerContent,
  });

  const repo = new SpyTaskRepository([inProgress]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  // INBOX must contain exactly one STALE_TASK entry for TASK-100
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  const count = (inbox.match(/\[STALE_TASK\] TASK-100/g) ?? []).length;
  assert.strictEqual(count, 1, 'INBOX must contain exactly one [STALE_TASK] TASK-100 entry (idempotent)');
});

test('does not mark task stale when ticksSinceAcquired is below threshold', async () => {
  const staleConfig = JSON.stringify({
    version: '0.6.0',
    minTicksBeforeSwitch: 2,
    governance: { conductEveryN: 3, staleTaskThresholdTicks: 10 },
    hanseiSinceTaskId: 195,
  });

  const inProgress = makeTask('TASK-100', 'P2', TaskStatus.IN_PROGRESS, true);

  // Acquired 3 ticks ago — below threshold of 10
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 3 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-100', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
    JSON.stringify({ tick: 2, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T01:00:00Z' }),
    JSON.stringify({ tick: 3, taskId: 'TASK-100', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T02:00:00Z' }),
  ].join('\n') + '\n';

  const fs = makeFs({
    'arch.config.json': staleConfig,
    'docs/tasks/TASK-100.md': inProgress.content,
    '.arch/focus-ledger.jsonl': ledgerContent,
  });

  const repo = new SpyTaskRepository([inProgress]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  // INBOX must NOT contain STALE_TASK
  const inbox = fs.files['docs/INBOX.md'] ?? '';
  assert.ok(!inbox.includes('[STALE_TASK] TASK-100'), 'INBOX must not contain STALE_TASK when below threshold');
  // Task must keep its focus
  assert.ok(fs.files['docs/tasks/TASK-100.md'].includes('Focus:yes'), 'IN_PROGRESS task below threshold must keep focus');
});

test('govern commits materialized report files (README, ROADMAP, METRICS, status-projection)', async () => {
  const task = makeTask('TASK-042', 'P2');
  const fs = makeFs({ 'docs/tasks/TASK-042.md': task.content });
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const reportFiles = ['README.md', 'docs/ROADMAP.md', 'docs/METRICS.md', '.arch/status-projection.json'];
  for (const f of reportFiles) {
    assert.ok(
      git.addCalls.includes(f),
      `${f} must be staged so it is included in a govern commit`
    );
  }
  assert.ok(
    git.commitCalls.some(m => m.includes('materialized') || m.includes('reporting') || m.includes('THINK')),
    'a commit must exist for the materialized reporting files'
  );
});

// ── Sprint-close version bump tests ─────────────────────────────────────────
//
// Strategy: govern only calls checkSprintLifecycle when archivedThisTick > 0.
// We seed one DONE task in docs/tasks/ (task ID < 195 → Hansei not required)
// so archiveDoneTasks() returns 1. We also seed one already-archived task so
// countSinceOpen reaches sprintCloseAfterN = 1 (conservative threshold).

const DONE_TASK_CONTENT =
  '## TASK-001: stub\n' +
  '**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/\n';

function makeSprintCloseFs(opts: {
  version: string;
  nextVersionBump?: string;
  belowThreshold?: boolean;
}): { fs: MockFileSystem; repo: SpyTaskRepository; git: MockGitRepository } {
  const { version, nextVersionBump, belowThreshold = false } = opts;
  const fs = new MockFileSystem();

  // Use sprintCloseAfterN = 1 for trigger tests; 5 for below-threshold test
  const sprintCloseAfterN = belowThreshold ? 5 : 1;

  const cfg: any = {
    version,
    currentSprint: 'sprint/v0.6.0-2026-01',
    sprintCloseAfterN,
    sprintAutoNamePrefix: 'sprint/v',
    governance: { conductEveryN: 100 },  // suppress conduct cadence
    hanseiSinceTaskId: 195,
    minTicksBeforeSwitch: 2,
  };
  if (nextVersionBump) cfg.nextVersionBump = nextVersionBump;
  fs.files['arch.config.json'] = JSON.stringify(cfg);

  // Active sprint state (started at epoch 0 — all closed-at timestamps qualify)
  fs.files['.arch/sprint-state.json'] = JSON.stringify({
    name: 'sprint/v0.6.0-2026-01',
    status: 'ACTIVE',
    startedAt: new Date(0).toISOString(),
  });
  fs.files['.arch/focus-ledger.jsonl'] = '';

  // cli/package.json
  fs.files['cli/package.json'] = JSON.stringify({ version, name: '@valentinlineiro/arch' }, null, 2);

  // One DONE task in docs/tasks/ — gets archived this tick (archivedThisTick = 1)
  fs.files['docs/tasks/TASK-001.md'] = DONE_TASK_CONTENT;

  // One already-archived task so countSinceOpen = 1 >= sprintCloseAfterN(1)
  const closedAt = new Date(1000).toISOString();
  fs.files['docs/archive/TASK-000.md'] =
    `## TASK-000\n**Meta:** P2 | S | DONE | Focus:no | 6-writing | local |\n**Closed-at:** ${closedAt}\n`;
  fs.dirs['docs/archive'] = ['TASK-000.md'];

  // RETRO + corpus files govern may touch
  fs.files['docs/RETRO.md'] = '# Sprint Retrospectives\n\n';
  fs.files['.arch/corpus-index.json'] = '{}';

  // Doc comment headers that DocVersion inspects — seeded with old version
  for (const docFile of [
    'AGENTS.md', 'GEMINI.md', 'docs/AGENTS.md',
    'docs/ONBOARDING.html', 'docs/index.html',
    'docs/agents/DO.md', 'docs/agents/THINK.md',
  ]) {
    fs.files[docFile] = `<!-- ARCH Framework v${version} | header -->\n`;
  }

  const doneTask = {
    id: 'TASK-001',
    title: 'stub',
    priority: 'P2',
    size: 'S',
    status: TaskStatus.DONE,
    focus: FocusLevel.NONE,
    sprint: '',
    class: '6-writing',
    cli: 'local',
    context: [],
    acceptanceCriteria: [],
    rawMetaLine: '**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/',
    depends: undefined,
    content: DONE_TASK_CONTENT,
    filePath: 'docs/tasks/TASK-001.md',
  };
  const repo = new SpyTaskRepository([doneTask]);
  const git = new MockGitRepository();
  return { fs, repo, git };
}

test('sprint close: bumps patch version in cli/package.json and arch.config.json', async () => {
  const { fs, repo, git } = makeSprintCloseFs({ version: '0.6.0' });
  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const pkg = JSON.parse(fs.files['cli/package.json']);
  assert.strictEqual(pkg.version, '0.6.1', 'package.json version should be bumped to 0.6.1');

  const cfgWrite = fs.writeCalls.findLast(w => w.path === 'arch.config.json');
  assert.ok(cfgWrite, 'arch.config.json must have been written');
  const cfg = JSON.parse(cfgWrite!.content);
  assert.strictEqual(cfg.version, '0.6.1', 'arch.config.json version should be bumped to 0.6.1');
});

test('sprint close: creates git tag vX.Y.Z and pushes', async () => {
  const { fs, repo, git } = makeSprintCloseFs({ version: '0.6.0' });
  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(git.tags.includes('v0.6.1'), 'git tag v0.6.1 must be created');
  assert.ok(
    git.pushArgs.some(args => args.includes('--follow-tags')),
    'git push --follow-tags must be called'
  );
});

test('sprint close: nextVersionBump:minor produces vX.(Y+1).0 and resets to patch', async () => {
  const { fs, repo, git } = makeSprintCloseFs({ version: '0.6.0', nextVersionBump: 'minor' });
  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const pkg = JSON.parse(fs.files['cli/package.json']);
  assert.strictEqual(pkg.version, '0.7.0', 'minor bump should produce 0.7.0');
  assert.ok(git.tags.includes('v0.7.0'), 'tag v0.7.0 must be created');

  // nextVersionBump must be reset to 'patch'
  const cfgWrite = fs.writeCalls.findLast(w => w.path === 'arch.config.json');
  assert.ok(cfgWrite, 'arch.config.json must be written');
  const cfg = JSON.parse(cfgWrite!.content);
  assert.strictEqual(cfg.nextVersionBump, 'patch', 'nextVersionBump must be reset to patch after minor bump');
});

test('sprint close: doc-header files are updated and staged in the bump commit', async () => {
  const { fs, repo, git } = makeSprintCloseFs({ version: '0.6.0' });
  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const docFiles = [
    'AGENTS.md', 'GEMINI.md', 'docs/AGENTS.md',
    'docs/ONBOARDING.html', 'docs/index.html',
    'docs/agents/DO.md', 'docs/agents/THINK.md',
  ];

  for (const docFile of docFiles) {
    const content = fs.files[docFile];
    assert.ok(content?.includes('v0.6.1'), `${docFile} should contain v0.6.1`);
    assert.ok(!content?.includes('v0.6.0'), `${docFile} should not still contain v0.6.0`);
    assert.ok(git.addCalls.includes(docFile), `${docFile} must be staged in the bump commit`);
  }
});

test('sprint close: threshold not reached — no version bump or tag', async () => {
  // belowThreshold: sprintCloseAfterN = 5 but only 1 archived task → no sprint close
  const { fs, repo, git } = makeSprintCloseFs({ version: '0.6.0', belowThreshold: true });
  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.strictEqual(git.tags.length, 0, 'no tags should be created when threshold not reached');
  const pkg = JSON.parse(fs.files['cli/package.json']);
  assert.strictEqual(pkg.version, '0.6.0', 'version should remain unchanged');
});

// ── AWAITING_REVIEW emit tests ────────────────────────────────────────────────

function makeReviewFs(tasks: any[]): MockFileSystem {
  const fs = makeFs({
    '.arch/focus-ledger.jsonl': '',
    'docs/INBOX.md': '# INBOX\n',
  });
  for (const t of tasks) {
    fs.files[`docs/tasks/${t.id}.md`] = t.content;
  }
  return fs;
}

test('govern emits AWAITING_REVIEW entry for each REVIEW-status task', async () => {
  const task = makeTask('TASK-042', 'P2', TaskStatus.REVIEW);
  const fs = makeReviewFs([task]);
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const inbox = fs.files['docs/INBOX.md'];
  assert.ok(inbox.includes('## [AWAITING_REVIEW] TASK-042'), 'AWAITING_REVIEW entry must be added for REVIEW task');
});

test('govern does not duplicate AWAITING_REVIEW entry on second tick', async () => {
  const task = makeTask('TASK-042', 'P2', TaskStatus.REVIEW);
  const fs = makeReviewFs([task]);
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  // First tick
  await system.execute();
  // Second tick — same system, same fs
  await system.execute();

  const inbox = fs.files['docs/INBOX.md'];
  const count = (inbox.match(/## \[AWAITING_REVIEW\] TASK-042/g) ?? []).length;
  assert.strictEqual(count, 1, 'AWAITING_REVIEW entry must not be duplicated on second tick');
});

test('govern emits no AWAITING_REVIEW entries when no tasks are in REVIEW', async () => {
  const task = makeTask('TASK-042', 'P2', TaskStatus.READY);
  const fs = makeReviewFs([task]);
  const repo = new SpyTaskRepository([task]);
  const git = new MockGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  const inbox = fs.files['docs/INBOX.md'];
  assert.ok(!inbox.includes('[AWAITING_REVIEW]'), 'no AWAITING_REVIEW entries for non-REVIEW tasks');
});
