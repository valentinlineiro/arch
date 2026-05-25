import { test } from 'node:test';
import assert from 'node:assert';
import { ReflectInfluenceReport, DEFAULT_THRESHOLDS } from '../../main/ts/application/use-cases/reflect-influence-report.js';

test('DEFAULT_THRESHOLDS has minCorpusSize of 30', () => {
  assert.strictEqual(DEFAULT_THRESHOLDS.minCorpusSize, 30);
});

test('ReflectInfluenceReport.compute does not fire engagement violation below minCorpusSize', async () => {
  const decisions = Array.from({ length: 10 }, (_, i) => ({
    decision_id: `D-${i}`,
    timestamp: '2026-05-25T00:00:00Z',
    target: `IDEA-${i}`,
    outcome: 'promoted' as const,
    finality: 'committed' as const,
    influence_declared: false,
    based_on_proposals: [],
  }));

  const mockFs = {
    readFile: async () => decisions.map(d => JSON.stringify(d)).join('\n'),
    exists: async () => true,
    appendFile: async () => {},
    writeFile: async () => {},
    readDirectory: async () => [],
  };

  const report = new ReflectInfluenceReport(mockFs as any, '/fake');
  const result = await report.compute({ ...DEFAULT_THRESHOLDS, minCorpusSize: 30 });

  assert.strictEqual(result.corpus, 10);
  assert.strictEqual(result.engaged, 0);
  const engagementViolation = result.violations.find(v => v.rule === 'engagement');
  assert.strictEqual(engagementViolation, undefined, 'no engagement violation when corpus < minCorpusSize');
});

test('ReflectInfluenceReport.compute fires engagement violation at or above minCorpusSize', async () => {
  const decisions = Array.from({ length: 30 }, (_, i) => ({
    decision_id: `D-${i}`,
    timestamp: '2026-05-25T00:00:00Z',
    target: `IDEA-${i}`,
    outcome: 'promoted' as const,
    finality: 'committed' as const,
    influence_declared: false,
    based_on_proposals: [],
  }));

  const mockFs = {
    readFile: async () => decisions.map(d => JSON.stringify(d)).join('\n'),
    exists: async () => true,
    appendFile: async () => {},
    writeFile: async () => {},
    readDirectory: async () => [],
  };

  const report = new ReflectInfluenceReport(mockFs as any, '/fake');
  const result = await report.compute({ ...DEFAULT_THRESHOLDS, minCorpusSize: 30 });

  assert.strictEqual(result.corpus, 30);
  const engagementViolation = result.violations.find(v => v.rule === 'engagement');
  assert.ok(engagementViolation, 'engagement violation fires when corpus >= minCorpusSize and rate is 0%');
});
