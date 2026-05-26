import { test } from 'node:test';
import assert from 'node:assert';
import { CausalGraph } from '../../main/ts/application/use-cases/causal-graph.js';
import { MockFileSystem } from './mocks/index.js';

// ── CausalGraph ────────────────────────────────────────────────────────────

test('add stores id, confidence, source, and status:active', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const entry = await graph.add('TASK-220', 'implements', 'ADR-011');
  assert.ok(entry.id);
  assert.strictEqual(entry.confidence, 'asserted');
  assert.strictEqual(entry.source, 'human');
  assert.strictEqual(entry.status, 'active');
  const raw = fs.files['/root/.arch/causal-graph.jsonl'];
  const parsed = JSON.parse(raw.trim());
  assert.strictEqual(parsed.id, entry.id);
  assert.strictEqual(parsed.status, 'active');
});

test('add stores note when provided', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-201', 'violated', 'GUIDELINE-core', 'missing retro entry');
  const raw = fs.files['/root/.arch/causal-graph.jsonl'];
  assert.strictEqual(JSON.parse(raw.trim()).note, 'missing retro entry');
});

test('add without note stores no note field', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const raw = fs.files['/root/.arch/causal-graph.jsonl'];
  assert.strictEqual(JSON.parse(raw.trim()).note, undefined);
});

test('all returns empty array when file does not exist', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  assert.deepStrictEqual(await graph.all(), []);
});

test('all returns all stored relations including corrections', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.weaken(e1.id);
  const all = await graph.all();
  assert.strictEqual(all.length, 2);
});

test('active returns only active edges', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  await graph.weaken(e1.id);
  const active = await graph.active();
  assert.strictEqual(active.length, 1);
  assert.strictEqual(active[0].from, 'TASK-184');
});

test('active returns empty array when no file exists', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  assert.deepStrictEqual(await graph.active(), []);
});

test('weaken appends a correction record with invalidates pointer', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.weaken(e1.id, 'new evidence changes confidence');
  const all = await graph.all();
  const correction = all.find(e => e.invalidates === e1.id)!;
  assert.ok(correction);
  assert.strictEqual(correction.status, 'weakened');
  assert.strictEqual(correction.note, 'new evidence changes confidence');
});

test('invalidate appends a correction record and removes edge from active', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'caused_by', 'TASK-184');
  await graph.invalidate(e1.id, 'causal direction was reversed');
  const active = await graph.active();
  assert.strictEqual(active.length, 0);
  const all = await graph.all();
  assert.strictEqual(all.length, 2);
});

test('weaken throws when edge id not found', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await assert.rejects(() => graph.weaken('nonexistent-id'), /Edge not found/);
});

test('invalidate throws when edge id not found', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await assert.rejects(() => graph.invalidate('nonexistent-id'), /Edge not found/);
});

test('query returns active outgoing and incoming by default', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  await graph.weaken(e1.id);

  const { outgoing, incoming } = await graph.query('TASK-220');
  assert.strictEqual(outgoing.length, 0);
  assert.strictEqual(incoming.length, 1);
});

test('query with includeInactive shows all original edges with status', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.weaken(e1.id);

  const { outgoing } = await graph.query('TASK-220', true);
  assert.strictEqual(outgoing.length, 1);
  assert.strictEqual(outgoing[0].status, 'weakened');
});

test('query returns empty sets when no file exists', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const { outgoing, incoming } = await graph.query('TASK-220');
  assert.deepStrictEqual(outgoing, []);
  assert.deepStrictEqual(incoming, []);
});

// ── Belief synthesis ───────────────────────────────────────────────────────

test('synthesize returns empty when entity has no edges', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const result = await graph.synthesize('TASK-999');
  assert.strictEqual(result.dominant.length, 0);
  assert.strictEqual(result.competing.length, 0);
  assert.strictEqual(result.superseded.length, 0);
});

test('synthesize assigns higher weight to asserted over heuristic', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011', undefined, 'heuristic', 'system');
  await graph.add('TASK-220', 'implements', 'ADR-011', undefined, 'asserted', 'human');
  const { dominant, competing } = await graph.synthesize('TASK-220');
  assert.strictEqual(dominant.length, 1);
  assert.strictEqual(dominant[0].edge.confidence, 'asserted');
  assert.strictEqual(competing.length, 1);
  assert.strictEqual(competing[0].edge.confidence, 'heuristic');
});

test('synthesize assigns higher weight to STRONG over MEDIUM relation', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  // Same (from, to) pair, different relation type — one dominates, one competes
  await graph.add('TASK-220', 'implements', 'ADR-011');   // MEDIUM, weight 7.2
  await graph.add('TASK-220', 'caused_by', 'ADR-011');    // STRONG, weight 10.8
  const { dominant, competing } = await graph.synthesize('TASK-220');
  assert.strictEqual(dominant.length, 1);
  assert.strictEqual(competing.length, 1);
  assert.strictEqual(dominant[0].edge.relation, 'caused_by');
  assert.ok(dominant[0].weight > competing[0].weight);
});

test('synthesize puts weakened edges in superseded', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.weaken(e1.id, 'new evidence');
  const { dominant, superseded } = await graph.synthesize('TASK-220');
  assert.strictEqual(dominant.length, 0);
  assert.strictEqual(superseded.length, 1);
  assert.strictEqual(superseded[0].edge.status, 'weakened');
});

test('synthesize distinguishes competing interpretations for same entity pair', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  // Two different claims about how TASK-220 relates to ADR-011
  await graph.add('TASK-220', 'implements', 'ADR-011', undefined, 'asserted');
  await graph.add('TASK-220', 'references', 'ADR-011', undefined, 'heuristic', 'system');
  const { dominant, competing } = await graph.synthesize('TASK-220');
  // Same (from, to) pair — one dominates, one competes
  assert.strictEqual(dominant.length, 1);
  assert.strictEqual(competing.length, 1);
  assert.strictEqual(dominant[0].edge.confidence, 'asserted');
  assert.strictEqual(competing[0].edge.confidence, 'heuristic');
});

// ── causalRelevance ────────────────────────────────────────────────────────

test('causalRelevance returns 1.0 with no query entities', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  assert.strictEqual(await graph.causalRelevance('TASK-184', []), 1.0);
});

test('causalRelevance returns 1.0 when candidate has no direct path to query entities', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  // TASK-184 is not in the graph at all relative to ADR-011
  assert.strictEqual(await graph.causalRelevance('TASK-184', ['ADR-011']), 1.0);
});

test('causalRelevance returns > 1.0 for candidate with STRONG direct path', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  const result = await graph.causalRelevance('TASK-184', ['TASK-220']);
  assert.ok(result > 1.0);
  // STRONG delta=0.5 → 1.0 + log(1.5)
  assert.ok(Math.abs(result - (1.0 + Math.log(1.5))) < 1e-9);
});

test('causalRelevance accumulates multiple qualifying paths', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');   // STRONG, query: TASK-220
  await graph.add('TASK-184', 'implements', 'ADR-011');   // MEDIUM, query: ADR-011
  const single = await graph.causalRelevance('TASK-184', ['TASK-220']);
  const both = await graph.causalRelevance('TASK-184', ['TASK-220', 'ADR-011']);
  assert.ok(both > single);
  // STRONG(0.5) + MEDIUM(0.3) = 0.8 → 1.0 + log(1.8)
  assert.ok(Math.abs(both - (1.0 + Math.log(1.8))) < 1e-9);
});

test('causalRelevance selects dominant per pair — does not double-count competing edges', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  // Two edges for same (TASK-184, TASK-220) pair — only dominant counts
  await graph.add('TASK-184', 'caused_by', 'TASK-220', undefined, 'asserted');   // STRONG, score 10.8
  await graph.add('TASK-184', 'references', 'TASK-220', undefined, 'heuristic', 'system'); // WEAK, score 1.0
  const result = await graph.causalRelevance('TASK-184', ['TASK-220']);
  // Only STRONG (delta=0.5) contributes, not WEAK (delta=0.1)
  assert.ok(Math.abs(result - (1.0 + Math.log(1.5))) < 1e-9);
});

test('causalRelevance ignores inactive edges', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-184', 'caused_by', 'TASK-220');
  await graph.invalidate(e1.id);
  assert.strictEqual(await graph.causalRelevance('TASK-184', ['TASK-220']), 1.0);
});
