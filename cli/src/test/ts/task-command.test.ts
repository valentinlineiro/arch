import { test } from 'node:test';
import assert from 'node:assert';
import { TaskCommand } from '../../main/ts/application/commands/task-command.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import { MockFileSystem } from './mocks/index.js';

class MockTaskRepository {
  async getById(id: string) {
    if (id === 'TASK-195') {
      return {
        id: 'TASK-195',
        title: 'Post-rollout Task',
        status: TaskStatus.IN_PROGRESS,
        content: '## TASK-195\n**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/',
        rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | local | docs/',
        acceptanceCriteria: []
      };
    }
    return null;
  }
  async save() {}
  async getAll() { return []; }
  async getActive() { return []; }
  async findReady() { return []; }
  async getNextId() { return 'TASK-001'; }
}

class MockReviewer {
  reviewTask() { return { valid: true, violations: [] }; }
}

function makeFs(): MockFileSystem {
  const fs = new MockFileSystem();
  fs.files['arch.config.json'] = JSON.stringify({ hanseiSinceTaskId: 195 });
  return fs;
}

function captureExit(fn: () => Promise<void>): Promise<number | undefined> {
  return new Promise(async (resolve) => {
    const originalExit = process.exit;
    process.exit = ((code: number) => {
      process.exit = originalExit;
      resolve(code);
      throw new Error('process.exit');
    }) as any;
    try {
      await fn();
      process.exit = originalExit;
      resolve(undefined);
    } catch (e: any) {
      if (e.message !== 'process.exit') {
        process.exit = originalExit;
        throw e;
      }
    }
  });
}

test('TaskCommand done - exits 1 when transition fails (e.g. missing Hansei)', async () => {
  const repo = new MockTaskRepository();
  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    makeFs() as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['done', 'TASK-195']));

  assert.strictEqual(exitCode, 1, 'task done must exit 1 when transition is blocked');
});

test('TaskCommand start - exits 1 when transition fails', async () => {
  const repo = new MockTaskRepository();
  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    makeFs() as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['start', 'TASK-999']));

  assert.strictEqual(exitCode, 1, 'task start must exit 1 on error');
});

test('TaskCommand metrics - exits 1 when update fails', async () => {
  const repo = new MockTaskRepository();
  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    makeFs() as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['metrics', 'TASK-999', '--cost', '0.05']));

  assert.strictEqual(exitCode, 1, 'task metrics must exit 1 on error');
});

test('TaskCommand done - exits 0 when transition passes', async () => {
  const repo = new MockTaskRepository();
  const fileSystem = makeFs();
  // Provide structured Hansei on the task object (parsed field, not raw content)
  const getByIdOriginal = repo.getById;
  repo.getById = async (id: string) => {
    const task: any = await getByIdOriginal.call(repo, id);
    if (task) {
      task.hansei = {
        severity: 'H1',
        category: '[TypeHack]',
        decision: 'Used any cast to bypass complex type circular dependency in parseTask (task-repository.ts).',
        constraint: 'P1 deadline and lack of specialized domain provider at the time.',
        cost: 'Type safety is degraded specifically in the parseTask method — src/repositories/task-repository.ts.',
        forwardAction: 'None scheduled. TASK-031 resolved. Monitor parseTask for recurrence.',
      };
    }
    return task;
  };

  const command = new TaskCommand(
    repo as any,
    new MockReviewer() as any,
    {} as any,
    fileSystem as any,
    '.',
  );

  const exitCode = await captureExit(() => command.execute(['done', 'TASK-195']));

  assert.strictEqual(exitCode, undefined, 'task done must not call process.exit(1) on success (should exit naturally with 0)');
});

import { hasUncheckedACs } from '../../main/ts/application/commands/task-command.js';

test('hasUncheckedACs - ignores unchecked items in Context Feedback section', () => {
  const content = `## TASK-001: test
### Acceptance Criteria
- [x] Intent addressed
  - \`prose: verified\`

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Definition of Done
- [x] All ACs checked by Auditor
`;
  assert.strictEqual(hasUncheckedACs(content), false,
    'Context Feedback unchecked items must not count as unchecked ACs');
});

test('hasUncheckedACs - detects unchecked items in Acceptance Criteria section', () => {
  const content = `## TASK-001: test
### Acceptance Criteria
- [ ] Not done yet
- [x] Done

### Context Feedback
- [x] accurate — files and ADRs were on-target
`;
  assert.strictEqual(hasUncheckedACs(content), true,
    'Unchecked item in Acceptance Criteria must be detected');
});

test('hasUncheckedACs - detects unchecked items in Definition of Done section', () => {
  const content = `## TASK-001: test
### Acceptance Criteria
- [x] All good

### Definition of Done
- [ ] All ACs checked by Auditor
`;
  assert.strictEqual(hasUncheckedACs(content), true,
    'Unchecked item in Definition of Done must be detected');
});
