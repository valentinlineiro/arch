import { test } from 'node:test';
import assert from 'node:assert';
import { InstitutionalAnomalyTracker } from '../../main/ts/domain/services/institutional-anomaly-tracker.js';
import type { CorpusEntry } from '../../main/ts/application/use-cases/corpus-index.js';

function makeEntry(id: string, category: string, severity: string, cls: string): CorpusEntry {
  return {
    id, size: 'S', class: cls, closedAt: '2026-01-01T00:00:00Z',
    lockedCommit: null, actor: null, severity, category,
    decision: 'Clean.', constraint: 'None.', cost: 'None.', forwardAction: 'None.',
    acCount: 2, acMachineVerifiable: 2, closurePath: 'L3',
  };
}

const corpus = {
  'TASK-001': makeEntry('TASK-001', '[SpecDrift]', 'H1', '2-code-generation'),
  'TASK-002': makeEntry('TASK-002', '[SpecDrift]', 'H1', '2-code-generation'),
  'TASK-003': makeEntry('TASK-003', '[SpecDrift]', 'H2', '2-code-generation'),
  'TASK-004': makeEntry('TASK-004', '[TypeHack]', 'H0', '2-code-generation'),
  'TASK-005': makeEntry('TASK-005', '[LeakyAbstraction]', 'H1', '6-writing'),
};

test('InstitutionalAnomalyTracker - identifies recurring category above threshold', () => {
  const report = InstitutionalAnomalyTracker.analyze(corpus, 2);
  const specDrift = report.recurringCategories.find(c => c.category === '[SpecDrift]');
  assert.ok(specDrift, '[SpecDrift] should appear as recurring');
  assert.strictEqual(specDrift!.count, 3);
  assert.ok(specDrift!.taskIds.includes('TASK-001'));
});

test('InstitutionalAnomalyTracker - below-threshold categories not in recurring', () => {
  const report = InstitutionalAnomalyTracker.analyze(corpus, 2);
  const typeHack = report.recurringCategories.find(c => c.category === '[TypeHack]');
  assert.strictEqual(typeHack, undefined, '[TypeHack] appears once — should not be recurring');
});

test('InstitutionalAnomalyTracker - recurringCategories sorted by count descending', () => {
  const report = InstitutionalAnomalyTracker.analyze(corpus, 1);
  for (let i = 1; i < report.recurringCategories.length; i++) {
    assert.ok(
      report.recurringCategories[i].count <= report.recurringCategories[i - 1].count,
      'must be sorted descending by count'
    );
  }
});

test('InstitutionalAnomalyTracker - class concentration detected when one class dominates', () => {
  const report = InstitutionalAnomalyTracker.analyze(corpus, 2);
  assert.ok(report.classConcentration, 'should detect class concentration');
  assert.ok(report.classConcentration!.dominantClass === '2-code-generation');
});

test('InstitutionalAnomalyTracker - empty corpus returns empty report', () => {
  const report = InstitutionalAnomalyTracker.analyze({}, 2);
  assert.strictEqual(report.recurringCategories.length, 0);
  assert.strictEqual(report.classConcentration, null);
});
