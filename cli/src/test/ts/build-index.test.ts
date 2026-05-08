import { test } from 'node:test';
import assert from 'node:assert';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry, TaskEntry } from '../../main/ts/domain/models/context-index.js';
import { BuildIndex, normalizeCommits } from '../../main/ts/application/use-cases/build-index.js';

class MockFileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  written: Record<string, string> = {};

  async readFile(path: string): Promise<string> {
    if (!(path in this.files)) throw new Error(`File not found: ${path}`);
    return this.files[path];
  }
  async writeFile(path: string, content: string): Promise<void> { this.written[path] = content; }
  async exists(path: string): Promise<boolean> { return path in this.files || path in this.directories; }
  async readDirectory(path: string): Promise<string[]> { return this.directories[path] ?? []; }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
}

class MockGitRepository {
  private commits: Array<{ hash: string; message: string; date: string; files: string[] }>;

  constructor(commits: Array<{ hash: string; message: string; date: string; files: string[] }> = []) {
    this.commits = commits;
  }

  async getDiff(): Promise<string> { return ''; }
  async getLastCommitMessage(): Promise<string | null> { return null; }
  async getCurrentBranch(): Promise<string> { return 'main'; }
  async getStatusLines(): Promise<string[]> { return []; }
  async getLog(): Promise<string[]> { return []; }
  async add(): Promise<void> {}
  async rm(): Promise<void> {}
  async mv(): Promise<void> {}
  async commit(): Promise<void> {}
  async getFileLastModifiedDate(): Promise<Date | null> { return null; }
  async getChangedFilesInLastCommit(): Promise<string[]> { return []; }
  async getMergeCommits(): Promise<string[]> { return []; }
  async getStagedFiles(): Promise<string[]> { return []; }
  async getModifiedFiles(): Promise<string[]> { return []; }
  async getRepoRoot(): Promise<string> { return '/repo'; }
  async getCommitHistory(): Promise<Array<{ hash: string; message: string; date: string; files: string[] }>> {
    return this.commits;
  }
}

test('ContextIndex types are importable and structurally correct', () => {
  const file: FileEntry = {
    symbols: ['MyClass'],
    imports: ['cli/src/main/ts/domain/models/task.ts'],
    tags: ['domain', 'model', 'my', 'class'],
    criticality: 'core',
    runtimeUsage: 'hot',
  };

  const adr: AdrEntry = {
    title: 'Context as a budget',
    keywords: ['context', 'budget', 'token'],
    affectedModules: ['cli/src/main/ts/domain/services/config-loader.ts'],
    strength: 'enforced',
  };

  const guideline: GuidelineEntry = {
    tags: ['test', 'ci'],
    taskClasses: ['2-code-generation'],
  };

  const index: ContextIndex = {
    version: 1,
    builtAt: '2026-05-07T14:00:00Z',
    files: { 'cli/src/main/ts/domain/models/task.ts': file },
    adrs: { 'ADR-002': adr },
    guidelines: { 'testing-a-change.md': guideline },
    tasks: {},
  };

  assert.equal(index.version, 1);
  assert.equal(index.files['cli/src/main/ts/domain/models/task.ts'].criticality, 'core');
  assert.equal(index.adrs['ADR-002'].strength, 'enforced');
  assert.deepEqual(index.guidelines['testing-a-change.md'].taskClasses, ['2-code-generation']);
});

test('BuildIndex.extractSymbols extracts exported class, function, interface, enum, const names', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const content = `
export class MyService {}
export function doThing(): void {}
export interface Config {}
export enum Status { A = 'A' }
export const VERSION = '1.0';
export abstract class BaseService {}
const notExported = 1;
`;
  const symbols = builder.extractSymbols(content);
  assert.ok(symbols.includes('MyService'));
  assert.ok(symbols.includes('doThing'));
  assert.ok(symbols.includes('Config'));
  assert.ok(symbols.includes('Status'));
  assert.ok(symbols.includes('VERSION'));
  assert.ok(symbols.includes('BaseService'));
  assert.ok(!symbols.includes('notExported'));
});

test('BuildIndex.extractImports resolves relative imports to normalized paths', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const content = `
import { Foo } from './models/foo.js';
import { Bar } from '../../domain/bar.js';
import { Baz } from 'node:path';
`;
  const imports = builder.extractImports(content, 'cli/src/main/ts/application/use-cases/my-use-case.ts');
  assert.ok(imports.includes('cli/src/main/ts/application/use-cases/models/foo.ts'));
  assert.ok(imports.includes('cli/src/main/ts/domain/bar.ts'));
  // External imports (no leading '.') are not included
  assert.ok(!imports.some((i: string) => i.includes('node:path')));
});

test('BuildIndex.inferCriticality maps path segments to criticality values', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  assert.equal(builder.inferCriticality('cli/src/main/ts/domain/models/task.ts'), 'core');
  assert.equal(builder.inferCriticality('cli/src/main/ts/application/use-cases/capture.ts'), 'domain');
  assert.equal(builder.inferCriticality('cli/src/main/ts/infrastructure/cli/git-cli.ts'), 'support');
  assert.equal(builder.inferCriticality('cli/src/main/ts/index.ts'), 'utility');
});

test('BuildIndex.extractTags produces lowercase tokens from path and symbols', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const tags = builder.extractTags(
    'cli/src/main/ts/application/use-cases/capture-intent.ts',
    ['CaptureIntent']
  );
  assert.ok(tags.includes('application'));
  assert.ok(tags.includes('capture'));
  assert.ok(tags.includes('intent'));
});

test('BuildIndex.computeImportDepths assigns BFS depth from entry point', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const entries = {
    'a.ts': { symbols: [], imports: ['b.ts', 'c.ts'], tags: [], criticality: 'utility' as const, runtimeUsage: 'cold' as const },
    'b.ts': { symbols: [], imports: ['d.ts'], tags: [], criticality: 'utility' as const, runtimeUsage: 'cold' as const },
    'c.ts': { symbols: [], imports: [], tags: [], criticality: 'utility' as const, runtimeUsage: 'cold' as const },
    'd.ts': { symbols: [], imports: [], tags: [], criticality: 'utility' as const, runtimeUsage: 'cold' as const },
  };
  const depths = builder.computeImportDepths(entries, 'a.ts');
  assert.equal(depths['a.ts'], 0);
  assert.equal(depths['b.ts'], 1);
  assert.equal(depths['c.ts'], 1);
  assert.equal(depths['d.ts'], 2);
});

test('BuildIndex.parseAdr extracts title, keywords, strength, and affectedModules', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const content = `# ADR-002: Context as a budget, not a default

**Date:** 2026-04-23
**Status:** ACCEPTED

## Context
LLMs have finite context windows. Loading the entire codebase leads to token waste.

## Decision
Treat context as a scarce resource. See \`cli/src/main/ts/domain/services/config-loader.ts\`.
`;
  const adr = builder.parseAdr(content);
  assert.equal(adr.title, 'Context as a budget, not a default');
  assert.equal(adr.strength, 'enforced');
  assert.ok(adr.keywords.includes('context'));
  assert.ok(adr.keywords.includes('budget'));
  assert.ok(adr.affectedModules.includes('cli/src/main/ts/domain/services/config-loader.ts'));
});

test('BuildIndex.parseAdr marks PROPOSED ADRs as advisory', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const content = `# ADR-099: Experimental feature\n\n**Status:** PROPOSED\n\n## Context\nSomething new.`;
  const adr = builder.parseAdr(content);
  assert.equal(adr.strength, 'advisory');
});

test('BuildIndex.buildGuidelineIndex maps contextRules to GuidelineEntry', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const rules = {
    'testing-a-change.md': { taskClasses: ['2-code-generation', '7-operations'] },
    'versioning.md': { taskClasses: ['2-code-generation'] },
  };
  const guidelines = builder.buildGuidelineIndex(rules);
  assert.deepEqual(guidelines['testing-a-change.md'].taskClasses, ['2-code-generation', '7-operations']);
  assert.ok(guidelines['testing-a-change.md'].tags.includes('testing'));
  assert.deepEqual(guidelines['versioning.md'].taskClasses, ['2-code-generation']);
});

test('BuildIndex.execute() writes a valid JSON index to .arch/context-index.json', async () => {
  const fs = new MockFileSystem();
  fs.directories['cli/src/main/ts'] = ['domain'];
  fs.directories['cli/src/main/ts/domain'] = ['models'];
  fs.directories['cli/src/main/ts/domain/models'] = ['task.ts'];
  fs.files['cli/src/main/ts/domain/models/task.ts'] = `
export enum TaskStatus { READY = 'READY' }
export interface Task { id: string; }
`;
  fs.directories['docs/adr'] = ['ADR-002-context-as-budget.md'];
  fs.files['docs/adr/ADR-002-context-as-budget.md'] = `# ADR-002: Context budget\n\n**Status:** ACCEPTED\n\n## Context\nTokens are scarce.`;
  fs.directories['docs/guidelines'] = [];

  const builder = new BuildIndex(fs as any);
  await builder.execute({ 'testing-a-change.md': { taskClasses: ['2-code-generation'] } }, new MockGitRepository() as any);

  const written = fs.written['.arch/context-index.json'];
  assert.ok(written, 'index file should be written');
  const index = JSON.parse(written);
  assert.equal(index.version, 2);
  assert.ok(index.builtAt);
  assert.ok('cli/src/main/ts/domain/models/task.ts' in index.files);
  assert.ok(index.files['cli/src/main/ts/domain/models/task.ts'].symbols.includes('TaskStatus'));
  assert.ok('ADR-002' in index.adrs);
  assert.equal(index.adrs['ADR-002'].strength, 'enforced');
  assert.ok('testing-a-change.md' in index.guidelines);
});

test('BuildIndex.execute() gracefully handles missing ADR and guideline directories', async () => {
  const fs = new MockFileSystem();
  fs.directories['cli/src/main/ts'] = [];
  // docs/adr and docs/guidelines don't exist

  const builder = new BuildIndex(fs as any);
  await assert.doesNotReject(() => builder.execute({}, new MockGitRepository() as any));

  const written = fs.written['.arch/context-index.json'];
  const index = JSON.parse(written);
  assert.deepEqual(index.adrs, {});
  assert.deepEqual(index.guidelines, {});
});

test('TaskEntry and ContextIndex.tasks are structurally correct', () => {
  const task: TaskEntry = {
    commitCount: 3,
    lastCommitDate: '2026-05-08T10:00:00Z',
    touchedFrequency: {
      'cli/src/main/ts/application/use-cases/build-index.ts': 2,
      'cli/src/main/ts/domain/models/context-index.ts': 1,
    },
    recentCommitRefs: ['abc1234', 'def5678', 'ghi9012'],
    commitRefOverflow: false,
  };

  const index: ContextIndex = {
    version: 2,
    builtAt: '2026-05-08T10:00:00Z',
    files: {},
    adrs: {},
    guidelines: {},
    tasks: { 'TASK-217': task },
  };

  assert.equal(index.version, 2);
  assert.equal(index.tasks['TASK-217'].commitCount, 3);
  assert.equal(index.tasks['TASK-217'].commitRefOverflow, false);
  assert.equal(index.tasks['TASK-217'].touchedFrequency['cli/src/main/ts/application/use-cases/build-index.ts'], 2);
});

test('normalizeCommits extracts TASK-IDs from commit messages', () => {
  const commits = [
    { hash: 'abc1234', message: 'feat: [TASK-42] add feature', date: '2026-05-08T10:00:00Z', files: ['src/a.ts'] },
    { hash: 'def5678', message: 'fix: [TASK-42] fix bug', date: '2026-05-07T10:00:00Z', files: ['src/b.ts'] },
    { hash: 'ghi9012', message: 'chore: no task ref', date: '2026-05-06T10:00:00Z', files: ['src/c.ts'] },
  ];
  const result = normalizeCommits(commits);
  assert.equal(result.length, 3);
  assert.deepEqual(result[0].taskIds, ['TASK-42']);
  assert.deepEqual(result[1].taskIds, ['TASK-42']);
  assert.deepEqual(result[2].taskIds, []);
});

test('normalizeCommits deduplicates TASK-IDs per commit', () => {
  const commits = [
    { hash: 'abc1234', message: 'feat: [TASK-10] [TASK-10] duplicate', date: '2026-05-08T10:00:00Z', files: ['src/a.ts'] },
  ];
  const result = normalizeCommits(commits);
  assert.deepEqual(result[0].taskIds, ['TASK-10']);
});

test('normalizeCommits handles multiple TASK-IDs in one commit message', () => {
  const commits = [
    { hash: 'abc1234', message: 'feat: TASK-1 and TASK-2 combined', date: '2026-05-08T10:00:00Z', files: ['src/a.ts', 'src/b.ts'] },
  ];
  const result = normalizeCommits(commits);
  assert.deepEqual(result[0].taskIds.sort(), ['TASK-1', 'TASK-2']);
  assert.deepEqual(result[0].files, ['src/a.ts', 'src/b.ts']);
});

test('normalizeCommits is case-sensitive: task-123 is not a match', () => {
  const commits = [
    { hash: 'abc1234', message: 'feat: task-123 lowercase', date: '2026-05-08T10:00:00Z', files: [] },
  ];
  const result = normalizeCommits(commits);
  assert.deepEqual(result[0].taskIds, []);
});

test('normalizeCommits passes through hash, date, files unchanged', () => {
  const commits = [
    { hash: 'abc1234', message: 'feat: [TASK-5] thing', date: '2026-05-08T10:00:00Z', files: ['x.ts', 'y.ts'] },
  ];
  const result = normalizeCommits(commits);
  assert.equal(result[0].hash, 'abc1234');
  assert.equal(result[0].date, '2026-05-08T10:00:00Z');
  assert.deepEqual(result[0].files, ['x.ts', 'y.ts']);
});

test('BuildIndex.execute() writes tasks to context index from git history', async () => {
  const fs = new MockFileSystem();
  fs.directories['cli/src/main/ts'] = [];
  fs.directories['docs/adr'] = [];

  const git = new MockGitRepository([
    { hash: 'abc1234', message: 'feat: [TASK-42] add feature', date: '2026-05-08T10:00:00Z', files: ['src/a.ts', 'src/b.ts'] },
    { hash: 'def5678', message: 'fix: [TASK-42] fix bug', date: '2026-05-09T10:00:00Z', files: ['src/b.ts', 'src/c.ts'] },
    { hash: 'ghi9012', message: 'chore: no task', date: '2026-05-06T10:00:00Z', files: ['src/d.ts'] },
  ]);

  const builder = new BuildIndex(fs as any);
  await builder.execute({}, git as any);

  const written = JSON.parse(fs.written['.arch/context-index.json']);
  assert.equal(written.version, 2);
  assert.ok(written.tasks['TASK-42']);
  const task = written.tasks['TASK-42'];
  assert.equal(task.commitCount, 2);
  assert.equal(task.lastCommitDate, '2026-05-09T10:00:00Z');
  assert.equal(task.touchedFrequency['src/a.ts'], 1);
  assert.equal(task.touchedFrequency['src/b.ts'], 2);
  assert.equal(task.touchedFrequency['src/c.ts'], 1);
  assert.ok(!task.touchedFrequency['src/d.ts']);
  assert.ok(task.recentCommitRefs.includes('abc1234'));
  assert.ok(task.recentCommitRefs.includes('def5678'));
  assert.equal(task.commitRefOverflow, false);
});

test('BuildIndex sets commitRefOverflow when commit count exceeds MAX_COMMIT_REFS', async () => {
  const fs = new MockFileSystem();
  fs.directories['cli/src/main/ts'] = [];
  fs.directories['docs/adr'] = [];

  const manyCommits = Array.from({ length: 25 }, (_, i) => ({
    hash: `hash${i.toString().padStart(4, '0')}`,
    message: `feat: [TASK-99] commit ${i}`,
    date: `2026-05-${(i + 1).toString().padStart(2, '0')}T10:00:00Z`,
    files: [`src/file${i}.ts`],
  }));

  const git = new MockGitRepository(manyCommits);
  const builder = new BuildIndex(fs as any);
  await builder.execute({}, git as any);

  const written = JSON.parse(fs.written['.arch/context-index.json']);
  const task = written.tasks['TASK-99'];
  assert.equal(task.commitCount, 25);
  assert.equal(task.recentCommitRefs.length, 20);
  assert.equal(task.commitRefOverflow, true);
});
