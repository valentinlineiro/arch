import { test } from 'node:test';
import assert from 'node:assert';
import { CausalGraph } from '../../main/ts/application/use-cases/causal-graph.js';
import { CausalCommand } from '../../main/ts/application/commands/causal-command.js';

class MockFileSystem {
  files = new Map<string, string>();

  async readFile(path: string): Promise<string> {
    const c = this.files.get(path);
    if (c === undefined) throw new Error(`Not found: ${path}`);
    return c;
  }

  async appendFile(path: string, content: string): Promise<void> {
    this.files.set(path, (this.files.get(path) ?? '') + content);
  }

  async exists(_p: string): Promise<boolean> { return false; }
  async writeFile(_p: string, _c: string): Promise<void> {}
  async readDirectory(_p: string): Promise<string[]> { return []; }
  async rename(_o: string, _n: string): Promise<void> {}
  async mkdir(_p: string): Promise<void> {}
  async deleteFile(_p: string): Promise<void> {}
}

// ── CausalGraph ────────────────────────────────────────────────────────────

test('add stores id, confidence, source, and status:active', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const entry = await graph.add('TASK-220', 'implements', 'ADR-011');
  assert.ok(entry.id);
  assert.strictEqual(entry.confidence, 'asserted');
  assert.strictEqual(entry.source, 'human');
  assert.strictEqual(entry.status, 'active');
  const raw = fs.files.get('/root/.arch/causal-graph.jsonl')!;
  const parsed = JSON.parse(raw.trim());
  assert.strictEqual(parsed.id, entry.id);
  assert.strictEqual(parsed.status, 'active');
});

test('add stores note when provided', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-201', 'violated', 'GUIDELINE-core', 'missing retro entry');
  const raw = fs.files.get('/root/.arch/causal-graph.jsonl')!;
  assert.strictEqual(JSON.parse(raw.trim()).note, 'missing retro entry');
});

test('add without note stores no note field', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const raw = fs.files.get('/root/.arch/causal-graph.jsonl')!;
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

// ── CausalCommand ──────────────────────────────────────────────────────────

function makeIO(args: string[]) {
  const logs: string[] = [];
  const errors: string[] = [];
  let exitCode: number | undefined;
  const io = {
    getArgs: () => args,
    log: (s: string) => { logs.push(s); },
    error: (s: string) => { errors.push(s); },
    exit: (code: number): never => { exitCode = code; throw new Error(`exit:${code}`); },
    logs,
    errors,
    get exitCode() { return exitCode; },
  };
  return io;
}

test('causal add records relation with id in log', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-220', 'implements', 'ADR-011']);
  await new CausalCommand(graph, io).execute();
  assert.ok(io.logs.some(l => l.includes('TASK-220') && l.includes('implements') && l.includes('ADR-011')));
  assert.ok(io.logs.some(l => /\[[0-9a-f]{8}\]/.test(l)));
});

test('causal add defaults to asserted/human confidence', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-220', 'implements', 'ADR-011']);
  await new CausalCommand(graph, io).execute();
  const all = await graph.all();
  assert.strictEqual(all[0].confidence, 'asserted');
  assert.strictEqual(all[0].source, 'human');
});

test('causal add with --confidence heuristic stores heuristic', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-220', 'references', 'ADR-011', '--confidence', 'heuristic']);
  await new CausalCommand(graph, io).execute();
  assert.strictEqual((await graph.all())[0].confidence, 'heuristic');
});

test('causal add with invalid relation exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-001', 'invented', 'ADR-001']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
  assert.ok(io.errors.some(e => e.includes('Invalid relation')));
});

test('causal add with invalid confidence exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-220', 'implements', 'ADR-011', '--confidence', 'maybe']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
  assert.ok(io.errors.some(e => e.includes('Invalid confidence')));
});

test('causal add with missing args exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-001']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
});

test('causal weaken logs correction and removes edge from active', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const entry = await graph.add('TASK-220', 'implements', 'ADR-011');
  const io = makeIO(['weaken', entry.id, '--note', 'better evidence available']);
  await new CausalCommand(graph, io).execute();
  assert.ok(io.logs.some(l => l.includes('Weakened')));
  assert.strictEqual((await graph.active()).length, 0);
});

test('causal invalidate logs correction', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const entry = await graph.add('TASK-220', 'caused_by', 'TASK-184');
  const io = makeIO(['invalidate', entry.id, '--note', 'direction was reversed']);
  await new CausalCommand(graph, io).execute();
  assert.ok(io.logs.some(l => l.includes('Invalidated')));
  assert.strictEqual((await graph.active()).length, 0);
});

test('causal weaken with unknown id exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['weaken', 'nonexistent-id']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
});

test('causal show displays edge id prefix and strength', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const io = makeIO(['show', 'TASK-220']);
  await new CausalCommand(graph, io).execute();
  const output = io.logs.join('\n');
  assert.ok(/\[[0-9a-f]{8}\]/.test(output));
  assert.ok(output.includes('MEDIUM'));
  assert.ok(output.includes('asserted'));
});

test('causal show --all includes weakened edges with status label', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const entry = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.weaken(entry.id);
  const io = makeIO(['show', 'TASK-220', '--all']);
  await new CausalCommand(graph, io).execute();
  const output = io.logs.join('\n');
  assert.ok(output.includes('weakened'));
});

test('causal show without --all hides weakened edges', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const entry = await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.weaken(entry.id);
  const io = makeIO(['show', 'TASK-220']);
  await new CausalCommand(graph, io).execute();
  assert.ok(io.logs.some(l => l.includes('No active causal relations')));
});

test('causal show reports no relations when entity unknown', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['show', 'TASK-999']);
  await new CausalCommand(graph, io).execute();
  assert.ok(io.logs.some(l => l.includes('No')));
});

test('causal show with missing entity exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['show']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
});

test('unknown subcommand exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['oops']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
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

test('causal synthesize command shows dominant with weight and superseded', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const e1 = await graph.add('TASK-220', 'implements', 'ADR-011', undefined, 'heuristic', 'system');
  await graph.invalidate(e1.id, 'confirmed manually');
  await graph.add('TASK-220', 'implements', 'ADR-011', undefined, 'asserted', 'human');
  const io = makeIO(['synthesize', 'TASK-220']);
  await new CausalCommand(graph, io).execute();
  const output = io.logs.join('\n');
  assert.ok(output.includes('Dominant'));
  assert.ok(output.includes('Superseded'));
  assert.ok(output.includes('asserted'));
  assert.ok(output.includes('invalidated'));
});

test('causal synthesize with no entity exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['synthesize']);
  await assert.rejects(() => new CausalCommand(graph, io).execute(), /exit:1/);
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
