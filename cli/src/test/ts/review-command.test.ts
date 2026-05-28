import { test } from 'node:test';
import assert from 'node:assert';
import { ReviewCommand } from '../../main/ts/application/commands/review-command.js';
import { TaskStatus, Task, FocusLevel } from '../../main/ts/domain/models/task.js';
import { MockTaskRepository, MockGitRepository, MockFileSystem, createTestRepo } from './mocks/index.js';

test('ReviewCommand --help exits 0', async () => {
  const { fs, git } = createTestRepo();
  const command = new ReviewCommand(new MockTaskRepository(), git, fs);
  // Should not throw or exit
  await command.execute(['--help']);
});

test('ReviewCommand lists no REVIEW tasks', async () => {
  const repo = new MockTaskRepository();
  repo.tasks.push({
    id: 'TASK-001',
    title: 'Test task',
    priority: 'P1',
    size: 'S',
    status: TaskStatus.DONE,
    focus: FocusLevel.NONE,
    sprint: 'Focus:no',
    class: '6-writing',
    cli: 'claude',
    context: ['docs/'],
    content: '## TASK-001\n**Meta:** P1 | S | DONE | Focus:no | 6-writing | claude | docs/',
    acceptanceCriteria: [],
    filePath: 'docs/archive/TASK-001.md',
  } as Task);

  const command = new ReviewCommand(
    repo,
    new MockGitRepository(),
    new MockFileSystem(),
  );

  await command.execute([]);
});
