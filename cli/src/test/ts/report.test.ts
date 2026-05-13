import { test } from 'node:test';
import assert from 'node:assert';
import { ArchiveParser } from '../../main/ts/domain/services/archive-parser.js';
import { MetricsEngine } from '../../main/ts/domain/services/metrics-engine.js';

// Mock FileSystem
class MockFileSystem {
  files: Record<string, string> = {};
  dirs: Record<string, string[]> = {};
  existsResults: Record<string, boolean> = {};

  async readFile(path: string) { return this.files[path]; }
  async writeFile(path: string, content: string) { this.files[path] = content; }
  async readDirectory(path: string) { return this.dirs[path] || []; }
  async exists(path: string) { return this.existsResults[path] !== undefined ? this.existsResults[path] : true; }
}

// Mock GitRepository
class MockGitRepository {
  firstCommitDates: Record<string, Date> = {};
  async getFileFirstCommitDate(path: string) { return this.firstCommitDates[path] || null; }
  // other methods not needed for this test
  async getDiff() { return ''; }
  async getLastCommitMessage() { return ''; }
  async getCurrentBranch() { return ''; }
  async getStatusLines() { return []; }
  async getLog() { return []; }
  async add() {}
  async rm() {}
  async mv() {}
  async commit() {}
  async getFileLastModifiedDate() { return new Date(); }
  async getChangedFilesInLastCommit() { return []; }
  async getMergeCommits() { return []; }
  async getStagedFiles() { return []; }
  async getModifiedFiles() { return []; }
  async getRepoRoot() { return ''; }
  async getCommitHistory() { return []; }
}

test('ArchiveParser - parses task content correctly', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  const parser = new ArchiveParser(fs as any, git as any);

  const taskId = 'TASK-001';
  const filePath = `docs/archive/${taskId}.md`;
  fs.files[filePath] = `## ${taskId}: Test\n**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | local | cli/ | Turns: 5 | Cost: $0.12\n**Closed-at:** 2026-05-13T10:00:00Z\n`;
  git.firstCommitDates[filePath] = new Date('2026-05-13T08:00:00Z');

  const metric = (parser as any).parseTaskContent(taskId, fs.files[filePath], filePath);
  const result = await metric;

  assert.strictEqual(result.id, taskId);
  assert.strictEqual(result.size, 'XS');
  assert.strictEqual(result.class, '2-code-generation');
  assert.strictEqual(result.turns, 5);
  assert.strictEqual(result.cost, 0.12);
  assert.strictEqual(result.completedAt, '2026-05-13T10:00:00Z');
  assert.strictEqual(result.createdAt, '2026-05-13T08:00:00.000Z');
});

test('MetricsEngine - calculates cycle time percentiles', async () => {
  const fs = new MockFileSystem();
  fs.existsResults['docs/EVENTS.md'] = false;
  const engine = new MetricsEngine(fs as any);

  const tasks = [
    { id: 'T1', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T09:00:00Z', turns: null, cost: null, class: '' }, // 1h
    { id: 'T2', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T11:00:00Z', turns: null, cost: null, class: '' }, // 3h
    { id: 'T3', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T10:00:00Z', turns: null, cost: null, class: '' }, // 2h
  ];

  const metrics = await engine.calculate(tasks as any);
  
  assert.strictEqual(metrics.cycleTime['XS'].count, 3);
  assert.strictEqual(metrics.cycleTime['XS'].p50, 2); // Sorted: 1, 2, 3 -> index 1 is 2
  assert.strictEqual(metrics.cycleTime['XS'].p90, 3); // Sorted: 1, 2, 3 -> index 2 is 3
});

test('MetricsEngine - calculates review fail rate from events', async () => {
  const fs = new MockFileSystem();
  const engine = new MetricsEngine(fs as any);

  fs.files['docs/EVENTS.md'] = `
## 2026-05-13T08:00:00Z
TASK-001 | REVIEW -> READY

## 2026-05-13T09:00:00Z
TASK-001 | REVIEW -> DONE

## 2026-05-13T10:00:00Z
TASK-002 | REVIEW -> DONE
`;

  const metrics = await engine.calculate([]);
  
  // 1 fail, 2 passes -> 1 / (1 + 2) = 1/3 = 0.333...
  assert.strictEqual(typeof metrics.reviewFailRate, 'number');
  assert.ok(Math.abs((metrics.reviewFailRate as number) - 0.333) < 0.01);
});

test('MetricsEngine - uses cost heuristic when metadata is missing', async () => {
  const fs = new MockFileSystem();
  fs.existsResults['docs/EVENTS.md'] = false;
  const engine = new MetricsEngine(fs as any);

  const tasks = [
    { id: 'T1', size: 'XS', cost: null, createdAt: null, completedAt: null, turns: null, class: '' }, // heuristic: 0.05
    { id: 'T2', size: 'S',  cost: 0.20, createdAt: null, completedAt: null, turns: null, class: '' }, // actual
  ];

  const metrics = await engine.calculate(tasks as any);
  
  // (0.05 + 0.20) / 2 = 0.125
  assert.strictEqual(metrics.costPerTask.average, 0.125);
});
