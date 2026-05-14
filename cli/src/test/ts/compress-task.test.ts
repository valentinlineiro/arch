import { test } from 'node:test';
import assert from 'node:assert';
import { CompressTask } from '../../main/ts/application/use-cases/compress-task.ts';
import { MockFileSystem } from './mocks/index.js';

const FULL_TASK = `## TASK-222: arch ask v1+v2
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Closed-at:** 2026-05-12T07:53:50.043Z
**Depends:** none

### Context
This is the context section with lots of prose.

### Acceptance Criteria
- [x] arch ask tokenizes input → cmd: arch ask "test"; exit: 0
- [x] arch review passes → cmd: arch review; exit: 0

### Definition of Done
- [x] All ACs checked.

## Hansei
Task was implemented and committed but never formally closed.
`;

const TASK_NO_HANSEI = `## TASK-001: Publish repo to GitHub
**Meta:** P0 | S | DONE | Focus:no | 7-operations | human | README.md
**Closed-at:** 2026-01-01T00:00:00.000Z
**Depends:** none

### Context
Some context.

### Acceptance Criteria
- [x] Repo live at GitHub
`;

test('compress - retains header, meta, closed-at, depends', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/docs/archive/TASK-222.md'] = FULL_TASK;
  fs.dirs['/repo/docs/archive'] = ['TASK-222.md'];

  const compressor = new CompressTask(fs as any, '/repo');
  await compressor.execute('TASK-222');

  const result = fs.files['/repo/docs/archive/TASK-222.md'];
  assert.ok(result.includes('## TASK-222: arch ask v1+v2'));
  assert.ok(result.includes('**Meta:** P1 | M | DONE'));
  assert.ok(result.includes('**Closed-at:** 2026-05-12T07:53:50.043Z'));
  assert.ok(result.includes('**Depends:** none'));
});

test('compress - drops Context, AC, and DoD sections', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/docs/archive/TASK-222.md'] = FULL_TASK;

  const compressor = new CompressTask(fs as any, '/repo');
  await compressor.execute('TASK-222');

  const result = fs.files['/repo/docs/archive/TASK-222.md'];
  assert.ok(!result.includes('### Context'));
  assert.ok(!result.includes('### Acceptance Criteria'));
  assert.ok(!result.includes('### Definition of Done'));
  assert.ok(!result.includes('- [x] arch ask tokenizes'));
});

test('compress - retains Hansei section', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/docs/archive/TASK-222.md'] = FULL_TASK;

  const compressor = new CompressTask(fs as any, '/repo');
  await compressor.execute('TASK-222');

  const result = fs.files['/repo/docs/archive/TASK-222.md'];
  assert.ok(result.includes('## Hansei'));
  assert.ok(result.includes('Task was implemented and committed but never formally closed.'));
});

test('compress - works without Hansei section', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/docs/archive/TASK-001.md'] = TASK_NO_HANSEI;

  const compressor = new CompressTask(fs as any, '/repo');
  await compressor.execute('TASK-001');

  const result = fs.files['/repo/docs/archive/TASK-001.md'];
  assert.ok(result.includes('## TASK-001: Publish repo to GitHub'));
  assert.ok(result.includes('**Meta:** P0 | S | DONE'));
  assert.ok(!result.includes('### Context'));
  assert.ok(!result.includes('## Hansei'));
});

test('compress - throws when file not found', async () => {
  const fs = new MockFileSystem();
  const compressor = new CompressTask(fs as any, '/repo');

  await assert.rejects(
    () => compressor.execute('TASK-999'),
    /Archive file not found/
  );
});

test('compress --all - compresses all archive files', async () => {
  const fs = new MockFileSystem();
  fs.dirs['/repo/docs/archive'] = ['TASK-001.md', 'TASK-222.md'];
  fs.files['/repo/docs/archive/TASK-001.md'] = TASK_NO_HANSEI;
  fs.files['/repo/docs/archive/TASK-222.md'] = FULL_TASK;

  const compressor = new CompressTask(fs as any, '/repo');
  const ids = await compressor.executeAll();

  assert.deepStrictEqual(ids.sort(), ['TASK-001', 'TASK-222']);
  assert.ok(!fs.files['/repo/docs/archive/TASK-001.md'].includes('### Context'));
  assert.ok(!fs.files['/repo/docs/archive/TASK-222.md'].includes('### Context'));
});

test('compress - compress() method is idempotent', async () => {
  const fs = new MockFileSystem();
  fs.files['/repo/docs/archive/TASK-222.md'] = FULL_TASK;

  const compressor = new CompressTask(fs as any, '/repo');
  await compressor.execute('TASK-222');
  const first = fs.files['/repo/docs/archive/TASK-222.md'];
  fs.files['/repo/docs/archive/TASK-222.md'] = first;
  await compressor.execute('TASK-222');
  const second = fs.files['/repo/docs/archive/TASK-222.md'];

  assert.strictEqual(first, second);
});
