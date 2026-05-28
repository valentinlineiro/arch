import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MarkTaskReview } from '../../main/ts/application/use-cases/mark-task-review.js';
import { Task, TaskStatus, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockTaskRepository, MockFileSystem } from './mocks/index.js';

const validHansei = {
  severity: 'H1' as const,
  category: '[TypeHack]' as const,
  decision: 'Used any cast to bypass complex type circular dependency in parseTask (task-repository.ts).',
  constraint: 'P1 deadline and lack of specialized domain provider at the time.',
  cost: 'Type safety is degraded specifically in the parseTask method — src/repositories/task-repository.ts.',
  forwardAction: 'None scheduled. TASK-031 resolved. Monitor parseTask for recurrence.',
};

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'TASK-031',
    title: 'Test Task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    focus: FocusLevel.HIGH,
    sprint: '',
    class: '2-code-generation',
    cli: 'claude-code',
    context: [],
    content: '- [x] Manual verification → prose: verified manually\n',
    filePath: '/tmp/TASK-031.md',
    rawMetaLine: '',
    hansei: validHansei,
    ...overrides,
  };
}

test('MarkTaskReview - throws when task not found', async () => {
  const repo = new MockTaskRepository();
  const useCase = new MarkTaskReview(repo, process.cwd());

  await assert.rejects(
    () => useCase.execute('TASK-999'),
    /TASK-999 not found/
  );
});

test('MarkTaskReview - throws when task is not IN_PROGRESS', async () => {
  const task = makeTask({ status: TaskStatus.READY });
  const repo = new MockTaskRepository();
  repo.tasks.push(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  await assert.rejects(
    () => useCase.execute('TASK-031'),
    /not in IN_PROGRESS state/
  );
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskReview - blocks transition when predicate fails', async () => {
  const task = makeTask({
    content: '- [x] Command fails  →  cmd: false; exit: 0\n',
  });
  const repo = new MockTaskRepository();
  repo.tasks.push(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  const result = await useCase.execute('TASK-031');

  assert.strictEqual(result.passed, false);
  assert.strictEqual(result.failures.length, 1);
  assert.strictEqual(repo.saved, null);
});

test('MarkTaskReview - sets status to REVIEW when all predicates pass', async () => {
  const task = makeTask({
    content: '- [x] Command passes  →  cmd: true; exit: 0\n',
  });
  const repo = new MockTaskRepository();
  repo.tasks.push(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  const result = await useCase.execute('TASK-031');

  assert.strictEqual(result.passed, true);
  assert.strictEqual(repo.saved?.status, TaskStatus.REVIEW);
  assert.strictEqual(repo.saved?.focus, FocusLevel.NONE);
});

test('MarkTaskReview - sets status to REVIEW when no predicates present', async () => {
  const task = makeTask();
  const repo = new MockTaskRepository();
  repo.tasks.push(task);
  const useCase = new MarkTaskReview(repo, process.cwd());

  const result = await useCase.execute('TASK-031');

  assert.strictEqual(result.passed, true);
  assert.strictEqual(repo.saved?.status, TaskStatus.REVIEW);
  assert.strictEqual(repo.saved?.focus, FocusLevel.NONE);
});

test('MarkTaskReview - emits FLOW-REGRESSION warning when failing core flow context overlaps', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
  const docsDir = path.join(tempDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'PROJECT.md'), '\n## Core Flows\n- [ ] CLI unit tests pass\n  - `cmd: false; exit: 0`\n');

  try {
    const task = makeTask({
      context: ['cli/src/main/ts'],
      content: '- [x] Command passes  →  cmd: true; exit: 0\n',
    });
    const repo = new MockTaskRepository();
    repo.tasks.push(task);
    const mockFs = new MockFileSystem();
    mockFs.addFile('docs/PROJECT.md', '\n## Core Flows\n- [ ] CLI unit tests pass\n  - `cmd: false; exit: 0`\n');
    
    const useCase = new MarkTaskReview(repo, tempDir, mockFs);

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    try {
      const result = await useCase.execute('TASK-031');
      assert.strictEqual(result.passed, true);
      const hasWarningHeader = logs.some(l => l.includes('[FLOW-REGRESSION]'));
      const hasFlowName = logs.some(l => l.includes('CLI unit tests pass'));
      assert.strictEqual(hasWarningHeader && hasFlowName, true, 'Should log FLOW-REGRESSION warning');
    } finally {
      console.log = originalLog;
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('MarkTaskReview - does not emit FLOW-REGRESSION warning when context does not overlap', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arch-test-'));
  const docsDir = path.join(tempDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'PROJECT.md'), '\n## Core Flows\n- [ ] CLI unit tests pass\n  - `cmd: false; exit: 0`\n');

  try {
    const task = makeTask({
      context: ['server/src/main'],
      content: '- [x] Command passes  →  cmd: true; exit: 0\n',
    });
    const repo = new MockTaskRepository();
    repo.tasks.push(task);
    const mockFs = new MockFileSystem();
    mockFs.addFile('docs/PROJECT.md', '\n## Core Flows\n- [ ] CLI unit tests pass\n  - `cmd: false; exit: 0`\n');
    
    const useCase = new MarkTaskReview(repo, tempDir, mockFs);

    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      logs.push(args.join(' '));
    };

    try {
      const result = await useCase.execute('TASK-031');
      assert.strictEqual(result.passed, true);
      const hasWarning = logs.some(l => l.includes('[FLOW-REGRESSION]'));
      assert.strictEqual(hasWarning, false, 'Should not log warning when no overlap');
    } finally {
      console.log = originalLog;
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
