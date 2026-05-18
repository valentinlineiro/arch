import { test } from 'node:test';
import assert from 'node:assert';
import { MarkdownTaskRepository } from '../../main/ts/infrastructure/filesystem/markdown-task-repository.js';
import { MockFileSystem } from './mocks/index.js';

test('MarkdownTaskRepository parses Sprint line separately from Meta', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/tasks'] = ['TASK-200.md'];
  fs.files['docs/tasks/TASK-200.md'] = `## TASK-200: Sprint-aware task
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Sprint:** sprint/control-panel
**Depends:** TASK-199

### Acceptance Criteria
- [ ] Show sprint progress

### Definition of Done
- [ ] arch review passes
`;

  const repo = new MarkdownTaskRepository(fs as any);
  const [task] = await repo.getActive();

  assert.strictEqual(task.sprint, 'sprint/control-panel');
  assert.strictEqual(task.class, '2-code-generation');
  assert.strictEqual(task.cli, 'claude');
  assert.deepStrictEqual(task.context, ['cli/src/main/ts/']);
});

test('MarkdownTaskRepository - TASK-931: parseTask reads Locked-commit back (round-trip)', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/tasks'] = ['TASK-201.md'];
  fs.files['docs/tasks/TASK-201.md'] = `## TASK-201: Lockable task
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude | cli/src/
**Locked-commit:** abc123def456

### Acceptance Criteria
- [ ] Does something
`;

  const repo = new MarkdownTaskRepository(fs as any);
  const [task] = await repo.getActive();

  assert.strictEqual(task.lockedCommit, 'abc123def456',
    'parseTask must read **Locked-commit:** back into task.lockedCommit');
});
