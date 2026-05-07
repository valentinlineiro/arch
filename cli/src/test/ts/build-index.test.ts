import { test } from 'node:test';
import assert from 'node:assert';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry } from '../../main/ts/domain/models/context-index.js';
import { BuildIndex } from '../../main/ts/application/use-cases/build-index.js';

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
  await builder.execute({ 'testing-a-change.md': { taskClasses: ['2-code-generation'] } });

  const written = fs.written['.arch/context-index.json'];
  assert.ok(written, 'index file should be written');
  const index = JSON.parse(written);
  assert.equal(index.version, 1);
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
  await assert.doesNotReject(() => builder.execute());

  const written = fs.written['.arch/context-index.json'];
  const index = JSON.parse(written);
  assert.deepEqual(index.adrs, {});
  assert.deepEqual(index.guidelines, {});
});
