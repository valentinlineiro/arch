import { test } from 'node:test';
import assert from 'node:assert';
import { MarkdownTaskRepository } from '../../main/ts/infrastructure/filesystem/markdown-task-repository.js';

class MockFileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};

  async readFile(path: string) { return this.files[path] ?? ''; }
  async writeFile(path: string, content: string) { this.files[path] = content; }
  async exists(path: string) { return path in this.files || path in this.directories; }
  async readDirectory(path: string) { return this.directories[path] ?? []; }
  async rename() {}
}

test('MarkdownTaskRepository parses Sprint line separately from Meta', async () => {
  const fs = new MockFileSystem();
  fs.directories['docs/tasks'] = ['TASK-200.md'];
  fs.files['docs/tasks/TASK-200.md'] = `## TASK-200: Sprint-aware task
**Meta:** P2 | S | 5 | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/
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
