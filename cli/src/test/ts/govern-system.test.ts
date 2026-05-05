import { test } from 'node:test';
import assert from 'node:assert';
import { GovernSystem } from '../../main/ts/application/use-cases/govern-system.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

const makeReady = (id: string) => ({
  id,
  title: `Task ${id}`,
  priority: 'P2',
  size: 'S',
  value: 5,
  status: TaskStatus.READY,
  sprint: 'Focus:no',
  class: '6-writing',
  cli: 'local',
  context: [],
  acceptanceCriteria: [],
  rawMetaLine: `**Meta:** P2 | S | 5 | READY | Focus:no | 6-writing | local | docs/`,
  depends: undefined,
});

const READY_TASK = makeReady('TASK-042');
const READY_TASKS = [READY_TASK, makeReady('TASK-043'), makeReady('TASK-044')];

const ORIGINAL_FILE = `## TASK-042: Some task\n**Meta:** P2 | S | 5 | READY | Focus:no | 6-writing | local | docs/\n`;
const FOCUSED_FILE  = `## TASK-042: Some task\n**Meta:** P2 | S | 5 | READY | Focus:yes | 6-writing | local | docs/\n`;

const CONFIG = JSON.stringify({ version: '0.5.0', governance: { conductEveryN: 3, starvationCycles: 5 }, hanseiSinceTaskId: 195 });

class SpyFileSystem {
  files: Record<string, string> = {
    'arch.config.json': CONFIG,
    'docs/tasks/TASK-042.md': ORIGINAL_FILE,
  };
  directories: Record<string, string[]> = { 'docs/tasks': ['TASK-042.md'] };
  writeCalls: Array<{ path: string; content: string }> = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, content: string) {
    this.writeCalls.push({ path: p, content });
    this.files[p] = content;
  }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename() {}
}

class SpyTaskRepository {
  async getById() { return null; }
  async getAll() { return READY_TASKS; }
  async getActive() { return READY_TASKS; }
  async save() {}
  async findReady() { return READY_TASKS; }
  async getNextId() { return 'TASK-099'; }
}

class ArchiveTaskRepository extends SpyTaskRepository {
  constructor(private tasks: any[]) {
    super();
  }

  async getAll() { return this.tasks; }
  async getActive() { return this.tasks; }
  async findReady() { return []; }
}

class SucceedingGitRepository {
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

class FailingGitRepository extends SucceedingGitRepository {
  async commit() { throw new Error('git commit failed: nothing to commit'); }
}

test('focusTask rolls back file when git commit fails', async () => {
  const fs = new SpyFileSystem();
  const repo = new SpyTaskRepository();
  const git = new FailingGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);

  await assert.rejects(
    () => system.execute(),
    /Failed to commit focus|git commit failed/,
    'should propagate commit error'
  );

  const lastWrite = fs.writeCalls[fs.writeCalls.length - 1];
  assert.strictEqual(
    lastWrite?.content,
    ORIGINAL_FILE,
    'file must be restored to original content on commit failure'
  );
});

test('focusTask commits via gitRepository when commit succeeds', async () => {
  const fs = new SpyFileSystem();
  const repo = new SpyTaskRepository();
  const git = new SucceedingGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await system.execute();

  assert.ok(git.addCalls.includes('docs/tasks/TASK-042.md'), 'should call gitRepository.add');
  assert.ok(git.commitCalls.some(m => m.includes('TASK-042')), 'should call gitRepository.commit');

  assert.strictEqual(
    fs.files['docs/tasks/TASK-042.md'],
    FOCUSED_FILE,
    'file must contain Focus:yes after successful commit'
  );
});

test('archiveDoneTasks blocks auto-archiving post-rollout DONE task without Hansei', async () => {
  const task = {
    ...makeReady('TASK-195'),
    status: TaskStatus.DONE,
    rawMetaLine: '**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/',
  };
  const fs = new SpyFileSystem();
  fs.files['docs/tasks/TASK-195.md'] = '## TASK-195: Missing Hansei\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/\n';
  fs.directories['docs/tasks'] = ['TASK-195.md'];
  const repo = new ArchiveTaskRepository([task]);
  const git = new SucceedingGitRepository();

  const errorLogs: string[] = [];
  const system = new GovernSystem(repo as any, git as any, fs as any);
  await assert.rejects(
    () => system.execute(),
    /missing ## Hansei section/
  );

  assert.strictEqual(git.commitCalls.some(m => m.includes('archive [TASK-195]')), false);
  assert.strictEqual(git.addCalls.includes('docs/archive/TASK-195.md'), false);
});

test('archiveDoneTasks blocks phantom archive sync for post-rollout DONE task without Hansei', async () => {
  const fs = new SpyFileSystem();
  delete fs.files['docs/tasks/TASK-042.md'];
  fs.files['docs/archive/TASK-195.md'] = '## TASK-195: Missing Hansei\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/\n';
  fs.directories['docs/tasks'] = [];
  fs.directories['docs/archive'] = ['TASK-195.md'];
  const repo = new ArchiveTaskRepository([]);
  const git = new SucceedingGitRepository();
  git.getStatusLines = async () => ['?? docs/archive/TASK-195.md'];

  const system = new GovernSystem(repo as any, git as any, fs as any);
  await assert.rejects(
    () => system.execute(),
    /missing ## Hansei section/
  );

  assert.strictEqual(git.commitCalls.some(m => m.includes('archive [TASK-195]')), false);
  assert.strictEqual(git.addCalls.includes('docs/archive/TASK-195.md'), false);
});

test('archiveDoneTasks appends ANDON_HALT to INBOX.md and halts on Hansei violation', async () => {
  const task = {
    ...makeReady('TASK-195'),
    status: TaskStatus.DONE,
    rawMetaLine: '**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/',
  };
  const fs = new SpyFileSystem();
  fs.files['docs/tasks/TASK-195.md'] = '## TASK-195: Missing Hansei\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | docs/\n';
  fs.directories['docs/tasks'] = ['TASK-195.md'];
  fs.files['docs/INBOX.md'] = '# INBOX\n';
  const repo = new ArchiveTaskRepository([task]);
  const git = new SucceedingGitRepository();

  const system = new GovernSystem(repo as any, git as any, fs as any);
  
  await assert.rejects(
    () => system.execute(),
    /missing ## Hansei section/
  );

  const inboxContent = fs.files['docs/INBOX.md'];
  assert.ok(inboxContent.includes('ANDON_HALT | TASK-195'), 'INBOX must contain ANDON_HALT for TASK-195');
  assert.ok(inboxContent.includes('Evidence: missing ## Hansei section'), 'INBOX must contain violation evidence');
});
