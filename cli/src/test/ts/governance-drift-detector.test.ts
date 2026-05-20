import { test } from 'node:test';
import assert from 'node:assert';
import { GovernanceDriftDetector } from '../../main/ts/domain/services/governance-drift-detector.js';
import type { CorpusEntry } from '../../main/ts/application/use-cases/corpus-index.js';

function makeEntry(id: string, closedAt: string, severity: string, acMachineVerifiable: number, acCount: number): CorpusEntry {
  return {
    id, size: 'S', class: '2-code-generation', closedAt,
    lockedCommit: null, actor: null, severity,
    category: '[SpecDrift]', decision: 'Clean.', constraint: 'None.',
    cost: 'None.', forwardAction: 'None.',
    acCount, acMachineVerifiable, closurePath: 'L3',
  };
}

// 10 tasks: first 5 are H0 + high machine-verifiable, last 5 are H2 + low machine-verifiable
const shiftingCorpus: CorpusEntry[] = [
  makeEntry('TASK-001', '2026-01-01T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-002', '2026-01-02T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-003', '2026-01-03T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-004', '2026-01-04T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-005', '2026-01-05T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-006', '2026-02-01T00:00:00Z', 'H2', 1, 3),
  makeEntry('TASK-007', '2026-02-02T00:00:00Z', 'H2', 1, 3),
  makeEntry('TASK-008', '2026-02-03T00:00:00Z', 'H2', 1, 3),
  makeEntry('TASK-009', '2026-02-04T00:00:00Z', 'H2', 1, 3),
  makeEntry('TASK-010', '2026-02-05T00:00:00Z', 'H2', 1, 3),
];

const stableCorpus: CorpusEntry[] = [
  makeEntry('TASK-001', '2026-01-01T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-002', '2026-01-02T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-003', '2026-02-01T00:00:00Z', 'H0', 3, 3),
  makeEntry('TASK-004', '2026-02-02T00:00:00Z', 'H0', 3, 3),
];

test('GovernanceDriftDetector - detects severity shift in recent window', () => {
  const report = GovernanceDriftDetector.detect(shiftingCorpus, 5);
  assert.strictEqual(report.severityShifting, true);
  assert.ok(report.signals.some(s => s.includes('severity')), 'must include severity signal');
});

test('GovernanceDriftDetector - detects prose-AC increase in recent window', () => {
  const report = GovernanceDriftDetector.detect(shiftingCorpus, 5);
  assert.strictEqual(report.proseAcIncreasing, true);
  assert.ok(report.signals.some(s => s.includes('prose') || s.includes('machine-verifiable')), 'must include AC signal');
});

test('GovernanceDriftDetector - stable corpus produces no drift signals', () => {
  const report = GovernanceDriftDetector.detect(stableCorpus, 2);
  assert.strictEqual(report.severityShifting, false);
  assert.strictEqual(report.proseAcIncreasing, false);
  assert.strictEqual(report.signals.length, 0);
});

test('GovernanceDriftDetector - fewer than 2 windows returns empty report', () => {
  const report = GovernanceDriftDetector.detect([makeEntry('TASK-001', '2026-01-01T00:00:00Z', 'H0', 3, 3)], 5);
  assert.strictEqual(report.severityShifting, false);
  assert.strictEqual(report.proseAcIncreasing, false);
  assert.strictEqual(report.signals.length, 0);
});
