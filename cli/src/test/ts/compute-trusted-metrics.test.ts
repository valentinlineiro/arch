import { test } from 'node:test';
import assert from 'node:assert';
import { computeTrustedMetrics } from '../../main/ts/application/use-cases/compute-trusted-metrics.js';
import { MockFileSystem } from './mocks/index.js';

test('completedTasks counts files in docs/archive/', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = ['TASK-001.md', 'TASK-002.md'];
  fs.dirs['docs/tasks'] = []; // explicitly empty tasks dir
  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 2);
});

test('computeTrustedMetrics - counts .md files in docs/archive', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = ['TASK-001.md', 'TASK-002.md', 'TASK-003.md'];
  fs.dirs['docs/tasks'] = [];

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 3);
});

test('computeTrustedMetrics - ignores non-.md files in archive', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = ['TASK-001.md', 'README.txt', 'TASK-002.md', '.gitkeep'];

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 2);
});

test('computeTrustedMetrics - returns 0 when archive dir is empty', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = [];

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 0);
});

test('computeTrustedMetrics - returns 0 when archive dir does not exist', async () => {
  const fs = new MockFileSystem();
  // No dirs['docs/archive'] set — readDirectory returns []

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 0);
});

test('computeTrustedMetrics - returns pending when EVENTS.md does not exist', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = ['TASK-001.md'];

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.reviewFailRate, 'pending');
});

test('computeTrustedMetrics - returns pending when no review exits in EVENTS.md', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = [];
  fs.files['docs/EVENTS.md'] = '# Event Log\n\n## 2026-01-01T00:00:00Z\nTASK-001 | IN_PROGRESS -> REVIEW\n';

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.reviewFailRate, 'pending');
});

test('computeTrustedMetrics - computes 0.0 rate with only approvals', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = [];
  fs.files['docs/EVENTS.md'] = [
    '# Event Log',
    '',
    '## 2026-01-01T00:00:00Z',
    'TASK-001 | REVIEW -> DONE | commit:abc | agent:human',
    '',
    '## 2026-01-02T00:00:00Z',
    'TASK-002 | REVIEW -> DONE | commit:def | agent:human',
  ].join('\n');

  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.reviewFailRate, 0);
});

test('computeTrustedMetrics - computes correct rate with rejections', async () => {
  const fs = new MockFileSystem();
  fs.dirs['docs/archive'] = [];
  fs.files['docs/EVENTS.md'] = [
    '# Event Log',
    '',
    '## 2026-01-01T00:00:00Z',
    'TASK-001 | REVIEW -> DONE | commit:abc | agent:human',
    '',
    '## 2026-01-02T00:00:00Z',
    'TASK-002 | REVIEW -> READY | commit:def | agent:human',
    '',
    '## 2026-01-03T00:00:00Z',
    'TASK-003 | REVIEW -> READY | commit:ghi | agent:human',
    '',
    '## 2026-01-04T00:00:00Z',
    'TASK-003 | REVIEW -> DONE | commit:jkl | agent:human',
  ].join('\n');

  // rejections=2, approvals=2, rate=0.5
  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.reviewFailRate, 0.5);
});

test('completedTasks counts DONE tasks in docs/tasks/ that are not yet archived', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/tasks/TASK-001.md'] = '**Meta:** P1 | M | DONE | Focus:no | ...';
  fs.files['docs/tasks/TASK-002.md'] = '**Meta:** P1 | M | IN_PROGRESS | Focus:yes | ...';
  fs.dirs['docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.dirs['docs/archive'] = [];
  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 1); // DONE counts, IN_PROGRESS does not
});

test('completedTasks adds archive count and DONE-in-tasks count together', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/tasks/TASK-003.md'] = '**Meta:** P1 | M | DONE | Focus:no | ...';
  fs.dirs['docs/archive'] = ['TASK-001.md', 'TASK-002.md'];
  fs.dirs['docs/tasks'] = ['TASK-003.md'];
  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 3); // 2 archived + 1 DONE in tasks
});
