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

test('add appends a JSONL line to causal-graph.jsonl', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const raw = fs.files.get('/root/.arch/causal-graph.jsonl')!;
  const parsed = JSON.parse(raw.trim());
  assert.strictEqual(parsed.from, 'TASK-220');
  assert.strictEqual(parsed.to, 'ADR-011');
  assert.strictEqual(parsed.relation, 'implements');
  assert.strictEqual(parsed.confidence, 'asserted');
  assert.strictEqual(parsed.source, 'human');
  assert.ok(parsed.timestamp);
});

test('add stores note when provided', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-201', 'violated', 'GUIDELINE-core', 'missing retro entry');
  const raw = fs.files.get('/root/.arch/causal-graph.jsonl')!;
  const parsed = JSON.parse(raw.trim());
  assert.strictEqual(parsed.note, 'missing retro entry');
});

test('add without note stores no note field', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const raw = fs.files.get('/root/.arch/causal-graph.jsonl')!;
  const parsed = JSON.parse(raw.trim());
  assert.strictEqual(parsed.note, undefined);
});

test('all returns empty array when file does not exist', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const result = await graph.all();
  assert.deepStrictEqual(result, []);
});

test('all returns all stored relations', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  const result = await graph.all();
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].relation, 'implements');
  assert.strictEqual(result[1].relation, 'caused_by');
});

test('query returns outgoing and incoming by entity', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  await graph.add('TASK-201', 'violated', 'GUIDELINE-core');

  const { outgoing, incoming } = await graph.query('TASK-220');
  assert.strictEqual(outgoing.length, 1);
  assert.strictEqual(outgoing[0].to, 'ADR-011');
  assert.strictEqual(incoming.length, 1);
  assert.strictEqual(incoming[0].from, 'TASK-184');
});

test('query returns empty sets when entity not found', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const { outgoing, incoming } = await graph.query('TASK-999');
  assert.strictEqual(outgoing.length, 0);
  assert.strictEqual(incoming.length, 0);
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

test('causal add records relation and logs confirmation', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-220', 'implements', 'ADR-011']);
  const cmd = new CausalCommand(graph, io);
  await cmd.execute();
  assert.ok(io.logs.some(l => l.includes('TASK-220') && l.includes('implements') && l.includes('ADR-011')));
  const all = await graph.all();
  assert.strictEqual(all.length, 1);
});

test('causal add with --note stores note', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-201', 'violated', 'GUIDELINE-core', '--note', 'missing retro']);
  const cmd = new CausalCommand(graph, io);
  await cmd.execute();
  const all = await graph.all();
  assert.strictEqual(all[0].note, 'missing retro');
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
  const all = await graph.all();
  assert.strictEqual(all[0].confidence, 'heuristic');
});

test('causal add with invalid confidence exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-220', 'implements', 'ADR-011', '--confidence', 'maybe']);
  const cmd = new CausalCommand(graph, io);
  await assert.rejects(() => cmd.execute(), /exit:1/);
  assert.ok(io.errors.some(e => e.includes('Invalid confidence')));
});

test('causal show displays strength and confidence on each edge', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  const io = makeIO(['show', 'TASK-220']);
  await new CausalCommand(graph, io).execute();
  const output = io.logs.join('\n');
  assert.ok(output.includes('MEDIUM'));
  assert.ok(output.includes('asserted'));
});

test('causal add with invalid relation exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-001', 'invented', 'ADR-001']);
  const cmd = new CausalCommand(graph, io);
  await assert.rejects(() => cmd.execute(), /exit:1/);
  assert.ok(io.errors.some(e => e.includes('Invalid relation')));
});

test('causal add with missing args exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['add', 'TASK-001']);
  const cmd = new CausalCommand(graph, io);
  await assert.rejects(() => cmd.execute(), /exit:1/);
});

test('causal show displays outgoing and incoming relations', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  await graph.add('TASK-220', 'implements', 'ADR-011');
  await graph.add('TASK-184', 'caused_by', 'TASK-220');
  const io = makeIO(['show', 'TASK-220']);
  const cmd = new CausalCommand(graph, io);
  await cmd.execute();
  const output = io.logs.join('\n');
  assert.ok(output.includes('Outgoing'));
  assert.ok(output.includes('ADR-011'));
  assert.ok(output.includes('Incoming'));
  assert.ok(output.includes('TASK-184'));
});

test('causal show reports no relations when entity unknown', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['show', 'TASK-999']);
  const cmd = new CausalCommand(graph, io);
  await cmd.execute();
  assert.ok(io.logs.some(l => l.includes('No causal relations')));
});

test('causal show with missing entity exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['show']);
  const cmd = new CausalCommand(graph, io);
  await assert.rejects(() => cmd.execute(), /exit:1/);
});

test('unknown subcommand exits 1', async () => {
  const fs = new MockFileSystem();
  const graph = new CausalGraph(fs, '/root');
  const io = makeIO(['oops']);
  const cmd = new CausalCommand(graph, io);
  await assert.rejects(() => cmd.execute(), /exit:1/);
});
