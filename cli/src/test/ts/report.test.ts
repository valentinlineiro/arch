import { test } from 'node:test';
import assert from 'node:assert';
import { ArchiveParser } from '../../main/ts/domain/services/archive-parser.js';
import { MetricsEngine } from '../../main/ts/domain/services/metrics-engine.js';
import { EventLogger } from '../../main/ts/domain/services/event-logger.js';
import { MockFileSystem as BaseMockFileSystem, MockGitRepository } from './mocks/index.js';

// Extended MockFileSystem to support existsResults override
class MockFileSystem extends BaseMockFileSystem {
  existsResults: Record<string, boolean> = {};

  override async exists(path: string): Promise<boolean> {
    if (path in this.existsResults) return this.existsResults[path];
    return super.exists(path);
  }
}

test('ArchiveParser - parses task content with git history provenance', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  const parser = new ArchiveParser(fs, git);

  const taskId = 'TASK-001';
  const archivePath = `docs/archive/${taskId}.md`;
  const taskPath = `docs/tasks/${taskId}.md`;
  
  fs.dirs['docs/archive'] = [`${taskId}.md`];
  fs.files[archivePath] = `## ${taskId}: Test\n**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | local | cli/ | Turns: 5 | Cost: $0.12\n**Closed-at:** 2026-05-13T10:00:00Z\n`;
  
  git.commits = [
    {
      hash: 'def',
      message: 'archive task',
      date: '2026-05-13T10:00:00Z',
      files: [{ status: 'R100', oldPath: taskPath, path: archivePath }]
    },
    {
      hash: 'abc',
      message: 'initial',
      date: '2026-05-13T08:00:00Z',
      files: [{ status: 'A', path: taskPath }]
    }
  ];

  const metrics = await parser.parseArchivedTasks();
  const result = metrics[0];

  assert.ok(result, 'Metric should exist');
  assert.strictEqual(result.id, taskId);
  assert.strictEqual(result.size, 'XS');
  assert.strictEqual(result.integrity, 'MEDIUM');
  assert.strictEqual(result.provenance?.methodId, 'git-history-inference-v2');
  assert.strictEqual(result.createdAt, '2026-05-13T08:00:00Z');
  assert.strictEqual(result.completedAt, '2026-05-13T10:00:00Z');
});

test('MetricsEngine - calculates cycle time and integrity levels', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  git.validHashes.add('abc');
  git.validHashes.add('def');
  git.validHashes.add('ghi');
  fs.existsResults['docs/EVENTS.md'] = true;
  // Events must be in chronological order
  fs.files['docs/EVENTS.md'] = '# Event Log\n\n## 2026-05-13T09:00:00Z\nTASK-001 | REVIEW -> DONE | commit:abc | agent:human\n\n## 2026-05-13T10:00:00Z\nTASK-003 | REVIEW -> DONE | commit:def | agent:human\n\n## 2026-05-13T11:00:00Z\nTASK-002 | REVIEW -> DONE | commit:ghi | agent:human\n';
  const engine = new MetricsEngine(fs, git);

  const tasks = [
    { id: 'TASK-001', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T09:00:00Z', integrity: 'HIGH', class: '' }, // 1h
    { id: 'TASK-002', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T11:00:00Z', integrity: 'MEDIUM', class: '' }, // 3h
    { id: 'TASK-003', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T10:00:00Z', integrity: 'HIGH', class: '' }, // 2h
  ];

  const metrics = await engine.calculate(tasks as any);
  
  assert.strictEqual(metrics.cycleTime['XS'].count, 3);
  assert.strictEqual(metrics.cycleTime['XS'].p50, 2);
  // All tasks have events and valid commits. 
  // TASK-002 was MEDIUM initially, so entropy > 0.
  // nonHighCount = 1, total = 3. Entropy = 0.33. > 0.1 -> MEDIUM.
  assert.strictEqual(metrics.integrityLevel, 'MEDIUM'); 
  assert.ok(metrics.integrityEntropy > 0);
  assert.strictEqual(metrics.provenance.methodId, 'metrics-engine-v4-witness-hardened');
});

test('MetricsEngine - Hostile: detects logistics-only archival (Attack Surface 1)', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  fs.existsResults['docs/EVENTS.md'] = true;
  fs.files['docs/EVENTS.md'] = '# Event Log\n\n## 2026-05-13T09:00:00Z\nTASK-001 | REVIEW -> DONE | commit:abc\n';
  git.validHashes.add('abc');
  const engine = new MetricsEngine(fs, git);

  const tasks = [
    { id: 'TASK-001', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T09:00:00Z', integrity: 'HIGH', class: '' },
    // TASK-002 has completedAt (from git move) but NO event log entry
    { id: 'TASK-002', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T11:00:00Z', integrity: 'MEDIUM', class: '' },
  ];

  const metrics = await engine.calculate(tasks as any);
  
  assert.strictEqual(metrics.integrityLevel, 'INVALID', 'Should be INVALID due to logistics-only archival');
});

test('MetricsEngine - Hostile: detects rewritten history (Attack Surface 2)', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  fs.existsResults['docs/EVENTS.md'] = true;
  // TASK-001 event references commit 'bad-hash' which is NOT in git
  fs.files['docs/EVENTS.md'] = '# Event Log\n\n## 2026-05-13T09:00:00Z\nTASK-001 | REVIEW -> DONE | commit:bad-hash\n';
  const engine = new MetricsEngine(fs, git);

  const tasks = [
    { id: 'TASK-001', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T09:00:00Z', integrity: 'HIGH', class: '' },
  ];

  const metrics = await engine.calculate(tasks as any);
  
  assert.strictEqual(metrics.integrityLevel, 'INVALID', 'Should be INVALID due to missing witness commit');
});

test('MetricsEngine - Hostile: detects ambiguous attribution (Attack Surface 3)', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  fs.existsResults['docs/EVENTS.md'] = true;
  // TASK-001 has TWO DONE events (ambiguous attribution/laundering)
  fs.files['docs/EVENTS.md'] = '# Event Log\n\n## 2026-05-13T09:00:00Z\nTASK-001 | REVIEW -> DONE | commit:abc | agent:agent-1\n\n## 2026-05-13T10:00:00Z\nTASK-001 | REVIEW -> DONE | commit:def | agent:agent-2\n';
  git.validHashes.add('abc');
  git.validHashes.add('def');
  const engine = new MetricsEngine(fs, git);

  const tasks = [
    { id: 'TASK-001', size: 'XS', createdAt: '2026-05-13T08:00:00Z', completedAt: '2026-05-13T09:00:00Z', integrity: 'HIGH', class: '' },
  ];

  const metrics = await engine.calculate(tasks as any);
  
  assert.strictEqual(metrics.integrityLevel, 'INVALID', 'Should be INVALID due to ambiguous attribution');
});

test('MetricsEngine - detects chronological regression', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  const engine = new MetricsEngine(fs, git);

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
  const git = new MockGitRepository();
  const engine = new MetricsEngine(fs, git);

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

test('EventLogger.append produces output parseable by MetricsEngine.loadEvents', async () => {
  const fs = new MockFileSystem();
  const git = new MockGitRepository();
  git.lastCommitHash = 'abc123';
  fs.existsResults['docs/EVENTS.md'] = true;
  git.validHashes.add('abc123');

  const logger = new EventLogger(fs, git);
  await logger.append({ taskId: 'TASK-001', from: 'REVIEW', to: 'DONE', timestamp: '2026-05-14T10:00:00.000Z' });
  await logger.append({ taskId: 'TASK-002', from: 'REVIEW', to: 'READY', timestamp: '2026-05-14T11:00:00.000Z' });

  const engine = new MetricsEngine(fs, git);
  const tasks = [
    { id: 'TASK-001', size: 'XS', createdAt: '2026-05-14T09:00:00Z', completedAt: '2026-05-14T10:00:00Z', integrity: 'HIGH', class: '' },
  ];

  // Should not throw — EventLogger format must be parseable by loadEvents
  const metrics = await engine.calculate(tasks as any);
  assert.strictEqual(metrics.reviewFailRate, 0.5, 'One DONE, one READY -> 50% fail rate');
});
