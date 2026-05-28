import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { TaskStatus, Task, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockFileSystem, MockTaskRepository, MockReviewer, MockFeedbackRepository, MockGitRepository, MockEventRepository, createTestRepo } from './mocks/index.js';

function makeTestTask(): Task {
  return {
    id: 'TASK-001',
    title: 'test task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.IN_PROGRESS,
    focus: FocusLevel.NONE,
    rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | src/',
    hansei: {
      severity: 'H1',
      category: '[TypeHack]',
      decision: 'Used any cast to bypass complex type circular dependency in repository.',
      constraint: 'P1 deadline and lack of specialized domain provider at the time.',
      cost: 'Type safety is degraded specifically in the parseTask method.',
      forwardAction: 'None scheduled. Task TASK-031 resolved. Monitor for recurrence.',
    },
    content: [
      '## TASK-001: test task',
      '**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | src/',
      '',
      '### Context Feedback',
      '_Was it useful?_',
      '- [x] accurate — files and ADRs were on-target',
      '- [ ] partial',
      '- [ ] off',
    ].join('\n'),
    context: ['src/'],
    sprint: 'Focus:no',
    class: '2-code-generation',
    cli: 'claude-code',
    filePath: 'docs/tasks/TASK-001.md',
    acceptanceCriteria: [],
    steps: 0,
  } as Task;
}

function setup() {
  const { fs, git: gitRepo } = createTestRepo({
    files: { 'arch.config.json': JSON.stringify({ hanseiSinceTaskId: 1 }) },
  });

  const taskRepo = new MockTaskRepository();
  taskRepo.tasks = [makeTestTask()];

  const reviewer = new MockReviewer();
  const feedbackRepo = new MockFeedbackRepository();
  const eventRepo = new MockEventRepository();

  return { fs, taskRepo, reviewer, feedbackRepo, gitRepo, eventRepo };
}

test('MarkTaskDone persists feedback signal when Context Feedback is checked', async () => {
  const { fs, taskRepo, reviewer, feedbackRepo, gitRepo, eventRepo } = setup();

  const useCase = new MarkTaskDone(taskRepo, reviewer as any, fs, eventRepo, feedbackRepo, undefined, undefined, gitRepo);
  await useCase.execute('TASK-001');

  assert.strictEqual(feedbackRepo.signals.length, 1);
  assert.strictEqual(feedbackRepo.signals[0].taskId, 'TASK-001');
  assert.strictEqual(feedbackRepo.signals[0].verdict, 'accurate');
});

test('MarkTaskDone does not crash when no feedback section exists', async () => {
  const { fs, taskRepo, reviewer, feedbackRepo, gitRepo, eventRepo } = setup();
  taskRepo.tasks[0].content = '## TASK-001: test\n**Meta:** P1 | S | IN_PROGRESS\n\n## Hansei\nAll good.\n';

  const useCase = new MarkTaskDone(taskRepo, reviewer as any, fs, eventRepo, feedbackRepo, undefined, undefined, gitRepo);
  await useCase.execute('TASK-001');

  assert.strictEqual(feedbackRepo.signals.length, 0);
});

test('MarkTaskDone skips feedback when no repository provided', async () => {
  const { fs, taskRepo, reviewer, gitRepo, eventRepo } = setup();

  // No feedbackRepo passed — should not throw
  const useCase = new MarkTaskDone(taskRepo, reviewer as any, fs, eventRepo, undefined, undefined, undefined, gitRepo);
  await assert.doesNotReject(() => useCase.execute('TASK-001'));
});
