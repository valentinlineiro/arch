import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

class MockTaskRepo {
  task: any = {
    id: 'TASK-001',
    status: TaskStatus.IN_PROGRESS,
    focus: false,
    rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | src/',
    content: [
      '## TASK-001: test task',
      '**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | src/',
      '',
      '## Hansei',
      'All good.',
      '',
      '### Context Feedback',
      '_Was it useful?_',
      '- [x] accurate — files and ADRs were on-target',
      '- [ ] partial',
      '- [ ] off',
    ].join('\n'),
    cost: '0.00',
    steps: 0,
  };
  async getById(_id: string) { return this.task; }
  async save(t: any) { this.task = t; }
}

class MockReviewer {
  reviewTask(_task: any, _meta: string) { return { valid: true, violations: [] }; }
}

class MockFS {
  files: Record<string, string> = { 'arch.config.json': JSON.stringify({ hanseiSinceTaskId: 1 }) };
  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files; }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async readDirectory(_p: string) { return []; }
  async rename(o: string, n: string) { this.files[n] = this.files[o]; delete this.files[o]; }
  async deleteFile(p: string) { delete this.files[p]; }
}

class MockFeedbackRepo {
  signals: any[] = [];
  async readAll() { return this.signals; }
  async append(s: any) { this.signals.push(s); }
}

test('MarkTaskDone persists feedback signal when Context Feedback is checked', async () => {
  const taskRepo = new MockTaskRepo() as any;
  const reviewer = new MockReviewer() as any;
  const fs = new MockFS();
  const feedbackRepo = new MockFeedbackRepo();

  const useCase = new MarkTaskDone(taskRepo, reviewer, fs as any, undefined, feedbackRepo as any);
  await useCase.execute('TASK-001');

  assert.strictEqual(feedbackRepo.signals.length, 1);
  assert.strictEqual(feedbackRepo.signals[0].taskId, 'TASK-001');
  assert.strictEqual(feedbackRepo.signals[0].verdict, 'accurate');
});

test('MarkTaskDone does not crash when no feedback section exists', async () => {
  const taskRepo = new MockTaskRepo() as any;
  taskRepo.task = {
    ...taskRepo.task,
    content: '## TASK-001: test\n**Meta:** P1 | S | IN_PROGRESS\n\n## Hansei\nAll good.\n',
  };
  const reviewer = new MockReviewer() as any;
  const fs = new MockFS();
  const feedbackRepo = new MockFeedbackRepo();

  const useCase = new MarkTaskDone(taskRepo, reviewer, fs as any, undefined, feedbackRepo as any);
  await useCase.execute('TASK-001');

  assert.strictEqual(feedbackRepo.signals.length, 0);
});

test('MarkTaskDone skips feedback when no repository provided', async () => {
  const taskRepo = new MockTaskRepo() as any;
  const reviewer = new MockReviewer() as any;
  const fs = new MockFS();

  // No feedbackRepo passed — should not throw
  const useCase = new MarkTaskDone(taskRepo, reviewer, fs as any);
  await assert.doesNotReject(() => useCase.execute('TASK-001'));
});
