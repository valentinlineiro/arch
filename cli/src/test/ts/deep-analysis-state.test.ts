import { test } from 'node:test';
import assert from 'node:assert';
import { DeepAnalysisState, readDeepAnalysisState, writeDeepAnalysisState, isDeepAnalysisDue } from '../../main/ts/application/use-cases/deep-analysis-state.js';
import { MockFileSystem } from './mocks/index.js';

test('readDeepAnalysisState returns null when file missing', async () => {
  const fs = new MockFileSystem({});
  const state = await readDeepAnalysisState(fs);
  assert.strictEqual(state, null);
});

test('writeDeepAnalysisState persists and readDeepAnalysisState retrieves', async () => {
  const fs = new MockFileSystem({});
  const state: DeepAnalysisState = { lastDeepRunTick: 3, lastDeepRunTimestamp: '2026-05-15T10:00:00.000Z' };
  await writeDeepAnalysisState(fs, state);
  const retrieved = await readDeepAnalysisState(fs);
  assert.deepStrictEqual(retrieved, state);
});

test('isDeepAnalysisDue returns true when ticks elapsed >= cadenceN', () => {
  assert.strictEqual(isDeepAnalysisDue({ lastDeepRunTick: 1, lastDeepRunTimestamp: '' }, 6, 5), true);  // 6-1=5 >= 5
  assert.strictEqual(isDeepAnalysisDue({ lastDeepRunTick: 2, lastDeepRunTimestamp: '' }, 6, 5), false); // 6-2=4 < 5
});

test('isDeepAnalysisDue returns true when state is null', () => {
  assert.strictEqual(isDeepAnalysisDue(null, 6, 5), true);
});
