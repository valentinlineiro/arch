import { test } from 'node:test';
import assert from 'node:assert';
import { GovernSystem } from '../../main/ts/application/use-cases/govern-system.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import { parseLedger } from '../../main/ts/application/use-cases/focus-ledger.js';

const TASK_META_READY_NO = `**Meta:** P2 | S | READY | Focus:no | 6-writing | local | docs/`;
const TASK_META_READY_YES = `**Meta:** P2 | S | READY | Focus:yes | 6-writing | local | docs/`;
const TASK_META_P1_NO = `**Meta:** P1 | S | READY | Focus:no | 6-writing | local | docs/`;

function makeTask(id: string, priority = 'P2', status = TaskStatus.READY, focus = false) {
  const focusStr = focus ? 'Focus:yes' : 'Focus:no';
  const rawMeta = `**Meta:** ${priority} | S | ${status} | ${focusStr} | 6-writing | local | docs/`;
  return {
    id,
    title: `Task ${id}`,
    priority,
    size: 'S',
    status,
    focus,
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

const CONFIG = JSON.stringify({
  version: '0.6.0',
  minTicksBeforeSwitch: 2,
  governance: { conductEveryN: 3 },
  hanseiSinceTaskId: 195,
});

class SpyFileSystem {
  files: Record<string, string> = { 'arch.config.json': CONFIG };
  writeCalls: Array<{ path: string; content: string }> = [];

  addFile(path: string, content: string) { this.files[path] = content; }

  async readFile(p: string) {
    if (!(p in this.files)) throw new Error(`File not found: ${p}`);
    return this.files[p];
  }
  async writeFile(p: string, content: string) {
    this.writeCalls.push({ path: p, content });
    this.files[p] = content;
  }
  async exists(p: string) { return p in this.files; }
  async readDirectory(_p: string) { return []; }
  async rename() {}
  async deleteFile(_p: string) {}
  async appendFile(p: string, content: string) {
    this.files[p] = (this.files[p] ?? '') + content;
  }
  async mkdir() {}
}

class SpyGitRepository {
  addCalls: string[] = [];
  commitCalls: string[] = [];

  async getDiff() { return ''; }
  async getLastCommitMessage() { return 'chore: stub [TASK-001]'; }
  async getCurrentBranch() { return 'main'; }
  async getStatusLines() { return []; }
  async getLog() { return ['chore: [THINK] session']; }
  async add(path: string) { this.addCalls.push(path); }
  async commit(msg: string) { this.commitCalls.push(msg); }
  async getFileLastModifiedDate() { return new Date(); }
  async getChangedFilesInLastCommit() { return []; }
  async getMergeCommits() { return []; }
  async rm() {}
  async mv() {}
}

class FailingGitRepository extends SpyGitRepository {
  async commit() { throw new Error('git commit failed: nothing to commit'); }
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
  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-042.md', task.content);
  const repo = new SpyTaskRepository([task]);
  const git = new SpyGitRepository();

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
  const fs = new SpyFileSystem();
  const repo = new SpyTaskRepository([task]);
  const git = new SpyGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(!fs.files['docs/tasks/TASK-042.md']?.includes('Focus:yes'), 'blocked task must not get focus');
});

// ─── Inercia window preservation ─────────────────────────────────────────────

test('preserves focus within inercia window when higher-priority task exists', async () => {
  const p2task = makeTask('TASK-042', 'P2', TaskStatus.READY, true);
  const p1task = makeTask('TASK-043', 'P1', TaskStatus.READY, false);

  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-042.md', p2task.content);
  fs.addFile('docs/tasks/TASK-043.md', p1task.content);

  // Ledger: TASK-042 acquired at tick 1, lastCommittedTick = 1
  // nextTick = 2, ticksSinceAcquired = 2 - 1 = 1 < minTicksBeforeSwitch(2) → preserve
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 1 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-042', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
  ].join('\n') + '\n';
  fs.addFile('.arch/focus-ledger.jsonl', ledgerContent);

  const repo = new SpyTaskRepository([p2task, p1task]);
  const git = new SpyGitRepository();

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

  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-042.md', p2task.content);
  fs.addFile('docs/tasks/TASK-043.md', p1task.content);

  // Ledger: TASK-042 acquired at tick 1, lastCommittedTick = 3
  // nextTick = 4, ticksSinceAcquired = 4 - 1 = 3 >= minTicksBeforeSwitch(2) → preempt
  const ledgerContent = [
    JSON.stringify({ meta: true, lastCommittedTick: 3 }),
    JSON.stringify({ tick: 1, taskId: 'TASK-042', action: 'FOCUS_ACQUIRED', timestamp: '2026-01-01T00:00:00Z' }),
    JSON.stringify({ tick: 2, taskId: 'TASK-042', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T01:00:00Z' }),
    JSON.stringify({ tick: 3, taskId: 'TASK-042', action: 'FOCUS_PRESERVED', timestamp: '2026-01-01T02:00:00Z' }),
  ].join('\n') + '\n';
  fs.addFile('.arch/focus-ledger.jsonl', ledgerContent);

  const repo = new SpyTaskRepository([p2task, p1task]);
  const git = new SpyGitRepository();

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
  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-042.md', task.content);
  // Empty ledger — no FOCUS_ACQUIRED ruling
  fs.addFile('.arch/focus-ledger.jsonl', JSON.stringify({ meta: true, lastCommittedTick: 0 }) + '\n');

  const repo = new SpyTaskRepository([task]);
  const git = new SpyGitRepository();

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

  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-042.md', blocked.content);
  fs.addFile('docs/tasks/TASK-043.md', ready.content);

  const repo = new SpyTaskRepository([blocked, ready]);
  const git = new SpyGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(!fs.files['docs/tasks/TASK-042.md'].includes('Focus:yes'), 'blocked task must not get focus');
  assert.ok(fs.files['docs/tasks/TASK-043.md'].includes('Focus:yes'), 'TASK-043 (READY) must get focus');
});

test('task with unresolved dependency is not eligible for focus', async () => {
  const dep = makeTask('TASK-001', 'P0', TaskStatus.READY);
  const task = { ...makeTask('TASK-042', 'P1', TaskStatus.READY), depends: ['TASK-001'] };

  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-042.md', task.content);
  fs.addFile('docs/tasks/TASK-001.md', dep.content);

  const repo = new SpyTaskRepository([task, dep]);
  const git = new SpyGitRepository();

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
    rawMetaLine: '**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/',
  };
  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-195.md', '## TASK-195: Missing Hansei\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/\n');
  const repo = new SpyTaskRepository([task]);
  const git = new SpyGitRepository();

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
    rawMetaLine: '**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/',
  };
  const fs = new SpyFileSystem();
  fs.addFile('docs/tasks/TASK-195.md', '## TASK-195: Missing Hansei\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/\n');
  fs.addFile('docs/INBOX.md', '# INBOX\n');
  const repo = new SpyTaskRepository([task]);
  const git = new SpyGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await assert.rejects(() => system.execute(), /missing ## Hansei section/);

  const inboxContent = fs.files['docs/INBOX.md'];
  assert.ok(inboxContent.includes('ANDON_HALT | TASK-195'), 'INBOX must contain ANDON_HALT');
  assert.ok(inboxContent.includes('Evidence: missing ## Hansei section'), 'INBOX must contain violation evidence');
});
