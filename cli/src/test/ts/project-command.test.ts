import { test } from 'node:test';
import assert from 'node:assert';
import { ProjectCommand } from '../../main/ts/application/commands/project-command.js';

// ── Minimal mocks ─────────────────────────────────────────────────────────

class MockFs {
  files: Record<string, string> = {
    'arch.config.json': JSON.stringify({
      version: '1.2.0',
      governance: { conductEveryN: 5 },
      paths: { adr: 'docs/adr', tasks: 'docs/tasks' },
    }),
  };
  dirs: Record<string, string[]> = { 'docs/adr': [], 'docs/tasks': [] };

  async readFile(p: string) {
    if (!(p in this.files)) throw new Error(`not found: ${p}`);
    return this.files[p];
  }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async exists(p: string) { return p in this.files || p in this.dirs; }
  async readDirectory(p: string) { return this.dirs[p] ?? []; }
  async rename() {}
  async deleteFile() {}
  async mkdir(p: string) { this.dirs[p] = []; }
}

function makeTaskRepo(nextId = 'TASK-002') {
  return {
    getAll: async () => [],
    getActive: async () => [],
    findReady: async () => [],
    getById: async () => null,
    getNextId: async () => nextId,
    save: async () => {},
  } as any;
}

const VALID_LLM_OUTPUT = JSON.stringify({
  adrs: [{ title: 'Use REST API', context: 'Need an API layer', decision: 'REST over GraphQL' }],
  tasks: [{ title: 'Create API endpoints', class: '2-code-generation', size: 'M', depends: 'none', acs: ['Endpoints respond with 200'] }],
  dod: ['All tasks archived', 'Integration tests pass'],
});

function makeMockProvider(response: string) {
  return {
    complete: async () => ({ content: response, usage: {} }),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────

test('ProjectCommand: exits non-zero when spec arg is missing', async () => {
  const fs = new MockFs();
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider(VALID_LLM_OUTPUT));
  await assert.rejects(
    () => cmd.execute(['init']),
    /spec/i,
    'should throw with message about missing spec'
  );
});

test('ProjectCommand: parses --depth flag (default 2)', async () => {
  const fs = new MockFs();
  let capturedPrompt = '';
  const provider = {
    complete: async (req: any) => {
      capturedPrompt = req.messages[0].content;
      return { content: VALID_LLM_OUTPUT, usage: {} };
    },
  } as any;
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', provider);
  await cmd.execute(['init', 'todo app']);
  assert.ok(capturedPrompt.includes('depth'), 'prompt should mention depth');
  assert.ok(capturedPrompt.includes('2'), 'default depth should be 2');
});

test('ProjectCommand: --depth N is passed to prompt', async () => {
  const fs = new MockFs();
  let capturedDepth = '';
  const provider = {
    complete: async (req: any) => {
      capturedDepth = req.messages[0].content;
      return { content: VALID_LLM_OUTPUT, usage: {} };
    },
  } as any;
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', provider);
  await cmd.execute(['init', 'todo app', '--depth', '3']);
  assert.ok(capturedDepth.includes('3'), 'prompt should reference depth 3');
});

test('ProjectCommand: writes docs/PROJECT.md with Ratification section', async () => {
  const fs = new MockFs();
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider(VALID_LLM_OUTPUT));
  await cmd.execute(['init', 'todo app']);
  assert.ok('docs/PROJECT.md' in fs.files, 'PROJECT.md should be created');
  assert.ok(fs.files['docs/PROJECT.md'].includes('Ratification'), 'PROJECT.md must have ## Ratification section');
  assert.ok(fs.files['docs/PROJECT.md'].includes('## Definition of Done'), 'PROJECT.md must have ## Definition of Done');
});

test('ProjectCommand: writes ADR file from LLM output', async () => {
  const fs = new MockFs();
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider(VALID_LLM_OUTPUT));
  await cmd.execute(['init', 'todo app']);
  const adrFiles = Object.keys(fs.files).filter(k => k.startsWith('docs/adr/ADR-'));
  assert.ok(adrFiles.length >= 1, 'at least one ADR file should be created');
  assert.ok(fs.files[adrFiles[0]].includes('Use REST API'), 'ADR should contain the title');
});

test('ProjectCommand: writes task file from LLM output', async () => {
  const fs = new MockFs();
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider(VALID_LLM_OUTPUT));
  await cmd.execute(['init', 'todo app']);
  const taskFiles = Object.keys(fs.files).filter(k => k.startsWith('docs/tasks/TASK-'));
  assert.ok(taskFiles.length >= 1, 'at least one task file should be created');
  assert.ok(fs.files[taskFiles[0]].includes('Create API endpoints'), 'task file should contain the title');
});

test('ProjectCommand: rejects malformed JSON from LLM — no partial files written', async () => {
  const fs = new MockFs();
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider('not json at all'));
  await assert.rejects(
    () => cmd.execute(['init', 'todo app']),
    /json|parse/i,
    'should throw on malformed JSON'
  );
  assert.ok(!('docs/PROJECT.md' in fs.files), 'PROJECT.md must not be written on LLM error');
  const adrFiles = Object.keys(fs.files).filter(k => k.startsWith('docs/adr/ADR-'));
  assert.strictEqual(adrFiles.length, 0, 'no ADR files should be written on LLM error');
});

test('ProjectCommand: extracts JSON from markdown code fence', async () => {
  const fs = new MockFs();
  const fenced = '```json\n' + VALID_LLM_OUTPUT + '\n```';
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider(fenced));
  await cmd.execute(['init', 'todo app']);
  assert.ok('docs/PROJECT.md' in fs.files, 'should parse JSON from code fence');
});

test('ProjectCommand: task file uses standard ARCH meta format', async () => {
  const fs = new MockFs();
  const cmd = new ProjectCommand(fs as any, makeTaskRepo(), '.', makeMockProvider(VALID_LLM_OUTPUT));
  await cmd.execute(['init', 'todo app']);
  const taskFiles = Object.keys(fs.files).filter(k => k.startsWith('docs/tasks/TASK-'));
  const content = fs.files[taskFiles[0]];
  assert.ok(content.includes('**Meta:**'), 'task must have Meta line');
  assert.ok(content.includes('READY'), 'task must be in READY status');
  assert.ok(content.includes('### Acceptance Criteria'), 'task must have AC section');
});
