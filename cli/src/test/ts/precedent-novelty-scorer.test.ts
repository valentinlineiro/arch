import { test } from 'node:test';
import assert from 'node:assert';
import { PrecedentNoveltyScorer } from '../../main/ts/domain/services/precedent-novelty-scorer.js';
import type { CorpusEntry } from '../../main/ts/application/use-cases/corpus-index.js';

function makeEntry(overrides: Partial<CorpusEntry> = {}): CorpusEntry {
  return {
    id: 'TASK-001', size: 'S', class: '2-code-generation',
    closedAt: '2026-01-01T00:00:00Z', lockedCommit: null, actor: null,
    severity: 'H0', category: '[SpecDrift]',
    decision: 'Clean.', constraint: 'None.', cost: 'None.', forwardAction: 'None.',
    acCount: 3, acMachineVerifiable: 3, closurePath: 'L3',
    ...overrides,
  };
}

const corpus: Record<string, CorpusEntry> = {
  'TASK-001': makeEntry({ id: 'TASK-001' }),
  'TASK-002': makeEntry({ id: 'TASK-002', size: 'M', class: '6-writing', acMachineVerifiable: 1 }),
  'TASK-003': makeEntry({ id: 'TASK-003', size: 'S', class: '2-code-generation' }),
};

test('PrecedentNoveltyScorer - identical task has score near 0 (low novelty)', () => {
  const descriptor = { size: 'S', class: '2-code-generation', acMachineVerifiableRatio: 1.0, hanseiSeverity: 'H0' };
  const report = PrecedentNoveltyScorer.score(descriptor, corpus);
  assert.ok(report.score < 0.3, `expected low novelty, got ${report.score}`);
  assert.ok(report.nearestPrecedents.length > 0, 'must return nearest precedents');
  assert.strictEqual(report.isHighNovelty, false);
});

test('PrecedentNoveltyScorer - dissimilar task has higher novelty score', () => {
  const descriptor = { size: 'XL', class: '7-operations', acMachineVerifiableRatio: 0.0, hanseiSeverity: 'H2' };
  const report = PrecedentNoveltyScorer.score(descriptor, corpus);
  assert.ok(report.score > 0.5, `expected high novelty, got ${report.score}`);
  assert.strictEqual(report.isHighNovelty, true);
});

test('PrecedentNoveltyScorer - empty corpus returns max novelty', () => {
  const descriptor = { size: 'S', class: '2-code-generation', acMachineVerifiableRatio: 1.0, hanseiSeverity: 'H0' };
  const report = PrecedentNoveltyScorer.score(descriptor, {});
  assert.strictEqual(report.score, 1.0);
  assert.strictEqual(report.clusterSize, 0);
  assert.strictEqual(report.isHighNovelty, true);
});

test('PrecedentNoveltyScorer - clusterSize counts entries with same class and size', () => {
  const descriptor = { size: 'S', class: '2-code-generation', acMachineVerifiableRatio: 1.0, hanseiSeverity: 'H0' };
  const report = PrecedentNoveltyScorer.score(descriptor, corpus);
  // TASK-001 and TASK-003 match class=2-code-generation, size=S
  assert.strictEqual(report.clusterSize, 2);
});

test('PrecedentNoveltyScorer - nearestPrecedents are sorted by distance ascending', () => {
  const descriptor = { size: 'S', class: '2-code-generation', acMachineVerifiableRatio: 1.0, hanseiSeverity: 'H0' };
  const report = PrecedentNoveltyScorer.score(descriptor, corpus);
  for (let i = 1; i < report.nearestPrecedents.length; i++) {
    assert.ok(
      report.nearestPrecedents[i].distance >= report.nearestPrecedents[i - 1].distance,
      'precedents must be sorted by distance ascending'
    );
  }
});

test('PrecedentNoveltyScorer - HIGH_NOVELTY_THRESHOLD is 0.6', () => {
  assert.strictEqual(PrecedentNoveltyScorer.HIGH_NOVELTY_THRESHOLD, 0.6);
});
