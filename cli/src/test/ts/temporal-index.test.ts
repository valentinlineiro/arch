import { test } from 'node:test';
import assert from 'node:assert';
import { TemporalIndex } from '../../main/ts/application/use-cases/temporal-index.js';
import { MockFileSystem, MockCausalSignalLog } from './mocks/index.js';

test('TemporalIndex.append writes JSONL record with taskId, timestamp, labels', async () => {
  const fs = new MockFileSystem();
  const idx = new TemporalIndex(fs, '/root');
  await idx.append('TASK-001', ['[ReviewBlindspot]', '[SpecDrift]']);
  const raw = fs.files['/root/.arch/temporal-index.jsonl'];
  assert.ok(raw, 'file must be created');
  const record = JSON.parse(raw.trim());
  assert.strictEqual(record.taskId, 'TASK-001');
  assert.deepStrictEqual(record.labels, ['[ReviewBlindspot]', '[SpecDrift]']);
  assert.ok(record.timestamp, 'timestamp must be present');
});

test('TemporalIndex.detectSpikes returns empty when fewer than 3 occurrences', async () => {
  const fs = new MockFileSystem();
  const idx = new TemporalIndex(fs, '/root');
  await idx.append('TASK-001', ['[SpecDrift]']);
  await idx.append('TASK-002', ['[SpecDrift]']);
  const spikes = await idx.detectSpikes();
  assert.deepStrictEqual(spikes, []);
});

test('TemporalIndex.detectSpikes returns spike when same label appears ≥3 times in last 20', async () => {
  const fs = new MockFileSystem();
  const idx = new TemporalIndex(fs, '/root');
  await idx.append('TASK-001', ['[SpecDrift]']);
  await idx.append('TASK-002', ['[SpecDrift]']);
  await idx.append('TASK-003', ['[SpecDrift]']);
  const spikes = await idx.detectSpikes();
  assert.strictEqual(spikes.length, 1);
  assert.strictEqual(spikes[0].label, '[SpecDrift]');
  assert.strictEqual(spikes[0].count, 3);
  assert.deepStrictEqual(spikes[0].taskIds.sort(), ['TASK-001', 'TASK-002', 'TASK-003']);
});

test('TemporalIndex.detectSpikes respects window — entries beyond last 20 are ignored', async () => {
  const fs = new MockFileSystem();
  const idx = new TemporalIndex(fs, '/root');
  // 2 old occurrences outside the 20-entry window
  for (let i = 1; i <= 2; i++) {
    await idx.append(`TASK-OLD-${i}`, ['[SpecDrift]']);
  }
  // 19 filler entries to push the old ones outside the window
  for (let i = 1; i <= 19; i++) {
    await idx.append(`TASK-FILLER-${i}`, ['[ReviewBlindspot]']);
  }
  // 1 new occurrence — only 1 within the window, no spike
  await idx.append('TASK-NEW-001', ['[SpecDrift]']);
  const spikes = await idx.detectSpikes();
  const specDriftSpike = spikes.find(s => s.label === '[SpecDrift]');
  assert.ok(!specDriftSpike, 'SpecDrift must not spike — only 1 occurrence in last 20');
});

test('TemporalIndex.detectSpikes uses configurable window and threshold', async () => {
  const fs = new MockFileSystem();
  const idx = new TemporalIndex(fs, '/root');
  await idx.append('TASK-001', ['[AuditGap]']);
  await idx.append('TASK-002', ['[AuditGap]']);
  // With threshold=2 and window=5, this should spike
  const spikes = await idx.detectSpikes(5, 2);
  assert.strictEqual(spikes.length, 1);
  assert.strictEqual(spikes[0].label, '[AuditGap]');
  assert.strictEqual(spikes[0].count, 2);
});

test('TemporalIndex emits recurs_in causal signal when spike is detected', async () => {
  const fs = new MockFileSystem();
  const idx = new TemporalIndex(fs, '/root');
  const mockSignalLog = new MockCausalSignalLog();

  await idx.append('TASK-001', ['[SpecDrift]']);
  await idx.append('TASK-002', ['[SpecDrift]']);
  // Third triggers spike
  const spikes = await idx.appendAndDetect('TASK-003', ['[SpecDrift]'], mockSignalLog);

  assert.strictEqual(spikes.length, 1);
  assert.strictEqual(mockSignalLog.emitted.length, 1, 'one causal signal must be emitted per spike');
  assert.strictEqual(mockSignalLog.emitted[0].candidate_relation, 'recurs_in');
  assert.strictEqual(mockSignalLog.emitted[0].candidate_from, 'TASK-003');
  assert.strictEqual(mockSignalLog.emitted[0].candidate_to, 'pattern:[SpecDrift]');
});
