import { test } from 'node:test';
import assert from 'node:assert';
import { AskCorpus } from '../../main/ts/application/use-cases/ask-corpus.js';

class MockFileSystem {
  private files: Map<string, string>;

  constructor(files: Record<string, string>) {
    this.files = new Map(Object.entries(files));
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`Not found: ${path}`);
    return content;
  }

  async readDirectory(path: string): Promise<string[]> {
    const prefix = path + '/';
    return [...this.files.keys()]
      .filter(k => k.startsWith(prefix))
      .map(k => k.slice(prefix.length));
  }

  async exists(_path: string): Promise<boolean> { return false; }
  async writeFile(_p: string, _c: string): Promise<void> {}
  async rename(_o: string, _n: string): Promise<void> {}
  async mkdir(_p: string): Promise<void> {}
  async appendFile(_p: string, _c: string): Promise<void> {}
  async deleteFile(_p: string): Promise<void> {}
}

test('tokenize strips stop words and short tokens', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.deepStrictEqual(corpus.tokenize('why do auth tasks fail?'), ['auth', 'tasks', 'fail']);
});

test('tokenize deduplicates', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.deepStrictEqual(corpus.tokenize('auth auth auth'), ['auth']);
});

test('tokenize returns empty for all-stop-words question', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.deepStrictEqual(corpus.tokenize('why is that the'), []);
});

test('execute throws on empty keywords', async () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  await assert.rejects(() => corpus.execute('why is that'), /No searchable keywords/);
});

test('execute scores files by keyword hits', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-001.md': 'auth validation at service boundary. auth check missing.',
    '/root/docs/archive/TASK-002.md': 'refactor routing layer',
    '/root/docs/adr/ADR-003.md': 'auth boundary rule applied',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth boundary');

  assert.deepStrictEqual(result.keywords, ['auth', 'boundary']);
  assert.strictEqual(result.matches.length, 2);
  assert.strictEqual(result.matches[0].path, 'docs/archive/TASK-001.md');
  assert.ok(result.matches[0].hits > result.matches[1].hits);
});

test('execute extracts task refs from matching files', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth failure\nauth failed. see TASK-031 and TASK-044 for prior occurrences.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failed');

  assert.ok(result.taskRefs.includes('TASK-010'));
  assert.ok(result.taskRefs.includes('TASK-031'));
  assert.ok(result.taskRefs.includes('TASK-044'));
});

test('execute extracts ADR refs from matching files', async () => {
  const fs = new MockFileSystem({
    '/root/docs/adr/ADR-005.md': '## ADR-005: auth boundary\nauth boundary enforced per ADR-001 and ADR-003.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth boundary');

  assert.ok(result.adrRefs.includes('ADR-001'));
  assert.ok(result.adrRefs.includes('ADR-003'));
  assert.ok(result.adrRefs.includes('ADR-005'));
});

test('execute returns empty matches when no keywords hit', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-001.md': 'completely unrelated content here',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');

  assert.strictEqual(result.matches.length, 0);
});

test('execute caps matches at 10', async () => {
  const files: Record<string, string> = {};
  for (let i = 1; i <= 15; i++) {
    files[`/root/docs/archive/TASK-${String(i).padStart(3, '0')}.md`] = `auth task number ${i}`;
  }
  const corpus = new AskCorpus(new MockFileSystem(files), '/root');
  const result = await corpus.execute('auth task');

  assert.ok(result.matches.length <= 10);
});

test('execute scopes entity refs to top-5 matches', async () => {
  const files: Record<string, string> = {};
  // 6 files matching "auth", only top-5 should contribute refs
  for (let i = 1; i <= 6; i++) {
    // file i has i hits, so file 6 is top, file 1 is 6th
    files[`/root/docs/archive/TASK-${String(i).padStart(3, '0')}.md`] =
      `## TASK-${String(i).padStart(3, '0')}: auth\n` + 'auth '.repeat(i) + `ADR-${String(i).padStart(3, '0')} mentioned`;
  }
  const corpus = new AskCorpus(new MockFileSystem(files), '/root');
  const result = await corpus.execute('auth');

  // ADR-001 is in file 1 (6th by score) — should NOT be in refs since only top-5 contribute
  assert.ok(!result.adrRefs.includes('ADR-001'));
  // ADR-006 is in file 6 (1st by score) — should be in refs
  assert.ok(result.adrRefs.includes('ADR-006'));
});

test('execute detects recurring signals from 3+ top matches', async () => {
  const files: Record<string, string> = {};
  // TASK-099 appears in 4 different files — should be a recurring signal
  for (let i = 1; i <= 5; i++) {
    const ref = i <= 4 ? 'see TASK-099 for history' : 'unrelated content here';
    files[`/root/docs/archive/TASK-${String(i).padStart(3, '0')}.md`] = `auth failure ${ref}`;
  }
  const corpus = new AskCorpus(new MockFileSystem(files), '/root');
  const result = await corpus.execute('auth failure');

  assert.ok(result.recurringSignals.some(s => s.startsWith('TASK-099')));
});
