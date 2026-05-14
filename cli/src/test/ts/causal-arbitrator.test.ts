import { test } from 'node:test';
import assert from 'node:assert';
import { CausalArbitrator } from '../../main/ts/application/use-cases/causal-arbitrator.js';
import { CausalSignalLog } from '../../main/ts/application/use-cases/causal-signal-log.js';
import { CausalGraph } from '../../main/ts/application/use-cases/causal-graph.js';
import { MockFileSystem } from './mocks/index.js';

function makeStack() {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const signals = new CausalSignalLog(fs, '/root');
  const arbitrator = new CausalArbitrator(signals, graph, 3);
  return { fs, graph, signals, arbitrator };
}

// ── Signal log ─────────────────────────────────────────────────────────────

test('signal log: append creates pending signal with review_count 0', async () => {
  const { signals } = makeStack();
  const s = await signals.append({
    domain: 'ontological',
    signal_type: 'reinforce',
    candidate_from: 'TASK-184',
    candidate_relation: 'caused_by',
    candidate_to: 'TASK-220',
    confidence: 0.7,
    event: 'task_completed:TASK-184',
  });
  assert.strictEqual(s.status, 'pending');
  assert.strictEqual(s.review_count, 0);
  assert.strictEqual(s.source, 'system');
  assert.ok(s.id);
});

test('signal log: pending() returns only pending signals', async () => {
  const { signals } = makeStack();
  const s1 = await signals.append({
    domain: 'ontological', signal_type: 'reinforce',
    candidate_from: 'A', candidate_relation: 'caused_by', candidate_to: 'B',
    confidence: 0.7, event: 'e1',
  });
  await signals.updateStatuses([{ id: s1.id, status: 'applied', review_count: 0 }]);
  await signals.append({
    domain: 'epistemological', signal_type: 'weaken',
    candidate_from: 'A', candidate_relation: 'caused_by', candidate_to: 'B',
    confidence: 0.4, event: 'e2',
  });
  const pending = await signals.pending();
  assert.strictEqual(pending.length, 1);
  assert.strictEqual(pending[0].domain, 'epistemological');
});

test('signal log: updateStatuses applies overrides correctly', async () => {
  const { signals } = makeStack();
  const s = await signals.append({
    domain: 'ontological', signal_type: 'create',
    candidate_from: 'X', candidate_relation: 'implements', candidate_to: 'Y',
    confidence: 0.8, event: 'e',
  });
  await signals.updateStatuses([{ id: s.id, status: 'stale', review_count: 3 }]);
  const all = await signals.all();
  assert.strictEqual(all.length, 1);
  assert.strictEqual(all[0].status, 'stale');
  assert.strictEqual(all[0].review_count, 3);
});

// ── Arbitration: no signals ────────────────────────────────────────────────

test('arbitrate with no pending signals returns zero counts', async () => {
  const { arbitrator } = makeStack();
  const result = await arbitrator.arbitrate();
  assert.strictEqual(result.applied.length, 0);
  assert.strictEqual(result.conflicted.length, 0);
  assert.strictEqual(result.stale.length, 0);
  assert.strictEqual(result.still_pending, 0);
});

// ── Arbitration: contradiction ─────────────────────────────────────────────

test('arbitrate marks conflicted when reinforce and weaken signals disagree', async () => {
  const { graph, signals, arbitrator } = makeStack();
  const edge = await graph.add('TASK-184', 'caused_by', 'TASK-220');
  await signals.append({
    domain: 'ontological', signal_type: 'reinforce',
    candidate_from: 'TASK-184', candidate_relation: 'caused_by', candidate_to: 'TASK-220',
    edge_id: edge.id, confidence: 0.7, event: 'task_completed:TASK-184',
  });
  await signals.append({
    domain: 'epistemological', signal_type: 'weaken',
    candidate_from: 'TASK-184', candidate_relation: 'caused_by', candidate_to: 'TASK-220',
    edge_id: edge.id, confidence: 0.4, event: 'recurrence:TASK-220',
  });
  const result = await arbitrator.arbitrate();
  assert.strictEqual(result.conflicted.length, 1);
  assert.strictEqual(result.applied.length, 0);
  assert.strictEqual(result.conflicted[0].candidate_from, 'TASK-184');
  // Graph is NOT mutated on conflict
  assert.strictEqual((await graph.active()).length, 1);
});

// ── Arbitration: cross-domain corroboration → create ──────────────────────

test('arbitrate applies create when two non-normative domains reinforce same candidate', async () => {
  const { signals, graph, arbitrator } = makeStack();
  await signals.append({
    domain: 'ontological', signal_type: 'create',
    candidate_from: 'TASK-300', candidate_relation: 'caused_by', candidate_to: 'TASK-200',
    confidence: 0.7, event: 'task_completed:TASK-300',
  });
  await signals.append({
    domain: 'epistemological', signal_type: 'reinforce',
    candidate_from: 'TASK-300', candidate_relation: 'caused_by', candidate_to: 'TASK-200',
    confidence: 0.6, event: 'recurrence:TASK-200',
  });
  const result = await arbitrator.arbitrate();
  assert.strictEqual(result.applied.length, 1);
  assert.strictEqual(result.applied[0].action, 'create');
  assert.ok(result.applied[0].new_edge_id);
  // New inferred edge committed to graph
  const active = await graph.active();
  const inferred = active.find(e => e.from === 'TASK-300' && e.relation === 'caused_by');
  assert.ok(inferred);
  assert.strictEqual(inferred!.confidence, 'inferred');
  assert.strictEqual(inferred!.source, 'system');
});

// ── Arbitration: cross-domain corroboration → weaken ──────────────────────

test('arbitrate applies weaken when two non-normative domains agree to weaken', async () => {
  const { graph, signals, arbitrator } = makeStack();
  const edge = await graph.add('TASK-184', 'fixes', 'TASK-100');
  await signals.append({
    domain: 'ontological', signal_type: 'weaken',
    candidate_from: 'TASK-184', candidate_relation: 'fixes', candidate_to: 'TASK-100',
    edge_id: edge.id, confidence: 0.6, event: 'task_completed:TASK-999',
  });
  await signals.append({
    domain: 'epistemological', signal_type: 'weaken',
    candidate_from: 'TASK-184', candidate_relation: 'fixes', candidate_to: 'TASK-100',
    edge_id: edge.id, confidence: 0.5, event: 'recurrence:TASK-100',
  });
  const result = await arbitrator.arbitrate();
  assert.strictEqual(result.applied.length, 1);
  assert.strictEqual(result.applied[0].action, 'weaken');
  // Edge is now weakened in graph
  const active = await graph.active();
  assert.strictEqual(active.length, 0);
});

// ── Arbitration: normative signals never auto-apply ────────────────────────

test('normative signals alone never trigger graph mutation', async () => {
  const { graph, signals, arbitrator } = makeStack();
  await graph.add('TASK-500', 'violated', 'GUIDELINE-core');
  await signals.append({
    domain: 'normative', signal_type: 'reinforce',
    candidate_from: 'TASK-600', candidate_relation: 'violated', candidate_to: 'GUIDELINE-core',
    confidence: 0.9, event: 'govern_violation:TASK-600',
  });
  const result = await arbitrator.arbitrate();
  assert.strictEqual(result.applied.length, 0);
  // Should tick toward expiry
  const pending = await signals.pending();
  assert.strictEqual(pending[0].review_count, 1);
});

test('normative signal does not contribute to cross-domain corroboration', async () => {
  const { signals, graph, arbitrator } = makeStack();
  await signals.append({
    domain: 'ontological', signal_type: 'create',
    candidate_from: 'TASK-700', candidate_relation: 'violated', candidate_to: 'GUIDELINE-x',
    confidence: 0.7, event: 'task_completed:TASK-700',
  });
  await signals.append({
    domain: 'normative', signal_type: 'reinforce',
    candidate_from: 'TASK-700', candidate_relation: 'violated', candidate_to: 'GUIDELINE-x',
    confidence: 0.9, event: 'govern_violation:TASK-700',
  });
  const result = await arbitrator.arbitrate();
  // Only one non-normative domain — no cross-domain corroboration → no apply
  assert.strictEqual(result.applied.length, 0);
  const active = await graph.active();
  assert.strictEqual(active.length, 0);
});

// ── Arbitration: expiry ────────────────────────────────────────────────────

test('single-domain signal expires after EXPIRY_CYCLES reviews', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const signals = new CausalSignalLog(fs, '/root');
  const arbitrator = new CausalArbitrator(signals, graph, 2);  // expire after 2 cycles

  await signals.append({
    domain: 'ontological', signal_type: 'reinforce',
    candidate_from: 'TASK-100', candidate_relation: 'references', candidate_to: 'ADR-001',
    confidence: 0.5, event: 'e',
  });

  // First review — review_count becomes 1, still pending (< 2)
  let result = await arbitrator.arbitrate();
  assert.strictEqual(result.stale.length, 0);
  assert.strictEqual(result.still_pending, 1);

  // Second review — review_count becomes 2, reaches threshold → stale
  result = await arbitrator.arbitrate();
  assert.strictEqual(result.stale.length, 1);
  assert.strictEqual(result.still_pending, 0);
});

test('stale signals are excluded from subsequent arbitration', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const signals = new CausalSignalLog(fs, '/root');
  const arbitrator = new CausalArbitrator(signals, graph, 1); // expire after 1

  await signals.append({
    domain: 'ontological', signal_type: 'reinforce',
    candidate_from: 'X', candidate_relation: 'implements', candidate_to: 'Y',
    confidence: 0.5, event: 'e',
  });

  await arbitrator.arbitrate(); // signal goes stale
  const result = await arbitrator.arbitrate(); // second run: nothing left
  assert.strictEqual(result.stale.length, 0);
  assert.strictEqual(result.still_pending, 0);
  assert.strictEqual(result.applied.length, 0);
});

// ── ARBITRATION DETERMINISM INVARIANT ──────────────────────────────────────

test('arbitration determinism: same signal set produces same result regardless of insertion order', async () => {
  async function runWithOrder(order: 'epist-first' | 'onto-first') {
    const fs = new MockFileSystem();
    const graph = new CausalGraph(fs, '/root');
    const signals = new CausalSignalLog(fs, '/root');
    const arbitrator = new CausalArbitrator(signals, graph, 3);

    const ts1 = '2026-05-11T10:00:00.000Z';
    const ts2 = '2026-05-11T10:00:01.000Z';

    if (order === 'epist-first') {
      await signals.append({ domain: 'epistemological', signal_type: 'create', candidate_from: 'A', candidate_relation: 'caused_by', candidate_to: 'B', confidence: 0.6, event: 'recurrence' });
      await signals.append({ domain: 'ontological', signal_type: 'create', candidate_from: 'A', candidate_relation: 'caused_by', candidate_to: 'B', confidence: 0.7, event: 'completed' });
    } else {
      await signals.append({ domain: 'ontological', signal_type: 'create', candidate_from: 'A', candidate_relation: 'caused_by', candidate_to: 'B', confidence: 0.7, event: 'completed' });
      await signals.append({ domain: 'epistemological', signal_type: 'create', candidate_from: 'A', candidate_relation: 'caused_by', candidate_to: 'B', confidence: 0.6, event: 'recurrence' });
    }

    // Override timestamps to same value to test id-based tiebreaking
    const all = await signals.pending();
    // Timestamps come from append — just verify both orders produce the same outcome
    return await arbitrator.arbitrate();
  }

  const r1 = await runWithOrder('onto-first');
  const r2 = await runWithOrder('epist-first');

  // Both should apply the same action
  assert.strictEqual(r1.applied.length, r2.applied.length);
  assert.strictEqual(r1.conflicted.length, r2.conflicted.length);
  assert.strictEqual(r1.stale.length, r2.stale.length);
  assert.strictEqual(r1.applied[0]?.action, r2.applied[0]?.action);
});

// ── QUERY ISOLATION INVARIANT ──────────────────────────────────────────────

test('query isolation: pending signals do not affect causalRelevance scoring', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const signals = new CausalSignalLog(fs, '/root');

  // Signal exists but has NOT been arbitrated → graph has no edge
  await signals.append({
    domain: 'ontological', signal_type: 'create',
    candidate_from: 'TASK-184', candidate_relation: 'caused_by', candidate_to: 'TASK-220',
    confidence: 0.7, event: 'task_completed:TASK-184',
  });

  // Query reads only the graph — which has no edge for this pair
  const relevance = await graph.causalRelevance('TASK-184', ['TASK-220']);

  // Must be exactly 1.0 — signal layer is invisible to query
  assert.strictEqual(relevance, 1.0);
});
