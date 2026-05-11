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

// ── Tokenizer ──────────────────────────────────────────────────────────────

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

// ── Query classification ───────────────────────────────────────────────────

test('classifyQuery detects DEFINITIONAL', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.strictEqual(corpus.classifyQuery('What is the point of this repo?'), 'DEFINITIONAL');
  assert.strictEqual(corpus.classifyQuery('What is ARCH?'), 'DEFINITIONAL');
  assert.strictEqual(corpus.classifyQuery("What's the purpose of this system?"), 'DEFINITIONAL');
});

test('classifyQuery detects HISTORICAL', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.strictEqual(corpus.classifyQuery('Why did auth tasks fail last sprint?'), 'HISTORICAL');
  assert.strictEqual(corpus.classifyQuery('What caused the routing incident?'), 'HISTORICAL');
});

test('classifyQuery detects STRUCTURAL', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.strictEqual(corpus.classifyQuery('Where is provider routing defined?'), 'STRUCTURAL');
  assert.strictEqual(corpus.classifyQuery('Which file handles drift detection?'), 'STRUCTURAL');
});

test('classifyQuery detects PATTERN', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.strictEqual(corpus.classifyQuery('What keeps failing in review?'), 'PATTERN');
  assert.strictEqual(corpus.classifyQuery('Why do tasks keep getting blocked?'), 'PATTERN');
});

test('classifyQuery falls back to GENERAL', () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  assert.strictEqual(corpus.classifyQuery('context inference feedback loop'), 'GENERAL');
});

// ── Scoring with class multipliers ────────────────────────────────────────

test('DEFINITIONAL query boosts IDENTITY.md over archive tasks', async () => {
  const fs = new MockFileSystem({
    '/root/docs/IDENTITY.md': '## 1. Definition\n> ARCH is a git-native protocol. arch arch arch arch arch',
    '/root/docs/archive/TASK-001.md': 'arch arch arch arch arch arch arch arch',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('What is arch?');

  assert.strictEqual(result.queryClass, 'DEFINITIONAL');
  assert.strictEqual(result.matches[0].path, 'docs/IDENTITY.md');
});

test('HISTORICAL query boosts archive over IDENTITY', async () => {
  const fs = new MockFileSystem({
    '/root/docs/IDENTITY.md': 'auth boundary auth auth auth auth auth auth auth',
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth failure\nauth auth auth',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('Why did auth fail?');

  assert.strictEqual(result.queryClass, 'HISTORICAL');
  assert.strictEqual(result.matches[0].path, 'docs/archive/TASK-010.md');
});

test('DEFINITIONAL query extracts answer from IDENTITY.md', async () => {
  const fs = new MockFileSystem({
    '/root/docs/IDENTITY.md': '# IDENTITY\n## 1. Definition\n> ARCH is a git-native operational protocol.\nThis sentence is frozen.\n## 2. Scope',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('What is ARCH?');

  assert.ok(result.answer !== null);
  assert.ok(result.answer!.includes('git-native'));
});

test('non-DEFINITIONAL query returns null answer', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-001.md': '## TASK-001: auth failure\nauth failed. something broke.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('Why did auth fail?');

  assert.strictEqual(result.answer, null);
});

// ── Core execution ─────────────────────────────────────────────────────────

test('execute throws on empty keywords', async () => {
  const corpus = new AskCorpus(new MockFileSystem({}), '/root');
  await assert.rejects(() => corpus.execute('why is that'), /No searchable keywords/);
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

test('execute scopes entity refs to top-5 matches', async () => {
  const files: Record<string, string> = {};
  for (let i = 1; i <= 6; i++) {
    files[`/root/docs/archive/TASK-${String(i).padStart(3, '0')}.md`] =
      `## TASK-${String(i).padStart(3, '0')}: auth\n` + 'auth '.repeat(i) + `ADR-${String(i).padStart(3, '0')} mentioned`;
  }
  const corpus = new AskCorpus(new MockFileSystem(files), '/root');
  const result = await corpus.execute('auth');
  assert.ok(!result.adrRefs.includes('ADR-001'));
  assert.ok(result.adrRefs.includes('ADR-006'));
});

test('execute detects recurring signals from 3+ top matches', async () => {
  const files: Record<string, string> = {};
  for (let i = 1; i <= 5; i++) {
    const ref = i <= 4 ? 'see TASK-099 for history' : 'unrelated content here';
    files[`/root/docs/archive/TASK-${String(i).padStart(3, '0')}.md`] = `auth failure ${ref}`;
  }
  const corpus = new AskCorpus(new MockFileSystem(files), '/root');
  const result = await corpus.execute('auth failure');
  assert.ok(result.recurringSignals.some(s => s.startsWith('TASK-099')));
});

// ── Cause groups ───────────────────────────────────────────────────────────

test('causeGroups surfaces token appearing in failure lines of 2+ archive tasks', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth failure\nauth failed due to missing coverage.',
    '/root/docs/archive/TASK-011.md': '## TASK-011: auth failure\nauth error: missing coverage in module.',
    '/root/docs/archive/TASK-012.md': '## TASK-012: auth failure\nauth broke: coverage incomplete.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');
  assert.ok(result.causeGroups.some(g => g.token === 'coverage'));
  const g = result.causeGroups.find(g => g.token === 'coverage')!;
  assert.ok(g.count >= 2);
});

test('causeGroups excludes query keywords from cause tokens', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth\nauth failed.',
    '/root/docs/archive/TASK-011.md': '## TASK-011: auth\nauth failed.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');
  assert.ok(!result.causeGroups.some(g => g.token === 'auth'));
  assert.ok(!result.causeGroups.some(g => g.token === 'failure'));
});

test('causeGroups returns empty when no failure lines in archive', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth\nauth completed successfully.',
    '/root/docs/archive/TASK-011.md': '## TASK-011: auth\nauth done without issues.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth task');
  assert.strictEqual(result.causeGroups.length, 0);
});

test('causeGroups ignores canonical docs (only archives/tasks)', async () => {
  const fs = new MockFileSystem({
    '/root/docs/IDENTITY.md': 'auth failed coverage coverage coverage coverage',
    '/root/docs/ROADMAP.md': 'auth failed coverage coverage coverage',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');
  assert.strictEqual(result.causeGroups.length, 0);
});

// ── Match reasons ──────────────────────────────────────────────────────────

test('match reasons include keyword hit counts', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth\nauth auth auth failed.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');
  const reasons = result.matches[0].reasons;
  assert.ok(reasons.some(r => r.includes('auth ×')));
});

test('match reasons include multiplier label when non-1', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '## TASK-010: auth\nauth failed.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('Why did auth fail?');
  const reasons = result.matches[0].reasons;
  assert.ok(reasons.some(r => r.includes('archive') && r.includes('×')));
});

test('match reasons include ADR refs found in content', async () => {
  const fs = new MockFileSystem({
    '/root/docs/adr/ADR-005.md': '## ADR-005: auth boundary\nauth boundary enforced per ADR-001.',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth boundary');
  const reasons = result.matches[0].reasons;
  assert.ok(reasons.some(r => r.includes('ADR-001')));
});

// ── Section-priority excerpt ───────────────────────────────────────────────

test('extractExcerpt prefers content after keyword-containing heading', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md':
      '# Unrelated heading\nsome preamble\n## auth failure details\nThis is the real context.\n## other section\nother stuff',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');
  assert.strictEqual(result.matches[0].excerpt, 'This is the real context.');
});

test('extractExcerpt falls back to first non-heading keyword line', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '# Title\nno keywords here\nauth failure happened here\nmore content',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth failure');
  assert.strictEqual(result.matches[0].excerpt, 'auth failure happened here');
});

test('extractExcerpt falls back to first non-blank line when no keyword match', async () => {
  const fs = new MockFileSystem({
    '/root/docs/archive/TASK-010.md': '\n\n# Task title\nauth description here',
  });
  const corpus = new AskCorpus(fs, '/root');
  const result = await corpus.execute('auth');
  assert.ok(result.matches[0].excerpt.length > 0);
});
