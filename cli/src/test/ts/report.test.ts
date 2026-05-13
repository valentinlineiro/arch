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
  commits: Array<{ hash: string; message: string; date: string; files: string[] }> = [];
  async getCommitHistory() { return this.commits; }
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
}

test('ArchiveParser - parses task content with git history provenance', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  const parser = new ArchiveParser(fs as any, git as any);

  const taskId = 'TASK-001';
  const filePath = `docs/archive/${taskId}.md`;
  fs.dirs['docs/archive'] = [`${taskId}.md`];
  fs.files[filePath] = `## ${taskId}: Test\n**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | local | cli/ | Turns: 5 | Cost: $0.12\n**Closed-at:** 2026-05-13T10:00:00Z\n`;
  
  git.commits = [{
    hash: 'abc',
    message: 'initial',
    date: '2026-05-13T08:00:00Z',
    files: [filePath]
  }];

  const metrics = await parser.parseArchivedTasks();
  const result = metrics[0];

  assert.ok(result, 'Metric should exist');
  assert.strictEqual(result.id, taskId);
  assert.strictEqual(result.size, 'XS');
  assert.strictEqual(result.integrity, 'MEDIUM');
  assert.strictEqual(result.provenance?.methodId, 'git-history-inference-v1');
  assert.strictEqual(result.createdAt, '2026-05-13T08:00:00Z');
});

test('MetricsEngine - calculates cycle time and integrity levels', async () => {
  const fs = new MockFileSystem();
  fs.existsResults['docs/EVENTS.md'] = true;
  fs.files['docs/EVENTS.md'] = '# Event Log\n## 2026-05-13T08:00:00Z\nTASK-001 | REVIEW -> DONE\n';
  const engine = new MetricsEngine(fs as any);

  const tasks = [
    { id: 'T1', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T09:00:00Z', integrity: 'HIGH', class: '' }, // 1h
    { id: 'T2', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T11:00:00Z', integrity: 'MEDIUM', class: '' }, // 3h
    { id: 'T3', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T10:00:00Z', integrity: 'HIGH', class: '' }, // 2h
  ];

  const metrics = await engine.calculate(tasks as any);
  
  assert.strictEqual(metrics.cycleTime['XS'].count, 3);
  assert.strictEqual(metrics.cycleTime['XS'].p50, 2);
  // Entropy = 1/3 (0.33), which is > 0.1 so integrity is MEDIUM
  assert.strictEqual(metrics.integrityLevel, 'MEDIUM'); 
  assert.ok(metrics.integrityEntropy > 0);
  assert.strictEqual(metrics.provenance.methodId, 'metrics-engine-v1');
});

test('MetricsEngine - detects chronological regression', async () => {
  const fs = new MockFileSystem();
  const engine = new MetricsEngine(fs as any);

  fs.files['docs/EVENTS.md'] = `
# Event Log
## 2026-05-13T10:00:00Z
TASK-001 | REVIEW -> READY
## 2026-05-13T09:00:00Z
TASK-002 | REVIEW -> READY
`;

  await assert.rejects(
    () => engine.calculate([]),
    { message: /Chronological regression detected/ }
  );
});

test('MetricsEngine - fails closed on malformed event log (Severity 2)', async () => {
  const fs = new MockFileSystem();
  const engine = new MetricsEngine(fs as any);

  fs.files['docs/EVENTS.md'] = `
# Event Log
## 2026-05-13T08:00:00Z
TASK-001 | REVIEW -> READY
GARBAGE LINE
`;

  await assert.rejects(
    () => engine.calculate([]),
    { message: /Integrity Violation: Unexpected content "GARBAGE LINE"/ }
  );
});

test('MetricsEngine - fails closed on malformed event header', async () => {
  const fs = new MockFileSystem();
  const engine = new MetricsEngine(fs as any);

  fs.files['docs/EVENTS.md'] = `
## MALFORMED HEADER
TASK-001 | REVIEW -> READY
`;

  await assert.rejects(
    () => engine.calculate([]),
    { message: /Integrity Violation: Malformed event header/ }
  );
});
