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
  const symbols = (builder as any).extractSymbols(content);
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
  const imports = (builder as any).extractImports(content, 'cli/src/main/ts/application/use-cases/my-use-case.ts');
  assert.ok(imports.includes('cli/src/main/ts/application/use-cases/models/foo.ts'));
  assert.ok(imports.includes('cli/src/main/ts/domain/bar.ts'));
  // External imports (no leading '.') are not included
  assert.ok(!imports.some((i: string) => i.includes('node:path')));
});

test('BuildIndex.inferCriticality maps path segments to criticality values', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  assert.equal((builder as any).inferCriticality('cli/src/main/ts/domain/models/task.ts'), 'core');
  assert.equal((builder as any).inferCriticality('cli/src/main/ts/application/use-cases/capture.ts'), 'domain');
  assert.equal((builder as any).inferCriticality('cli/src/main/ts/infrastructure/cli/git-cli.ts'), 'support');
  assert.equal((builder as any).inferCriticality('cli/src/main/ts/index.ts'), 'utility');
});

test('BuildIndex.extractTags produces lowercase tokens from path and symbols', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const tags = (builder as any).extractTags(
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
  const depths = (builder as any).computeImportDepths(entries, 'a.ts');
  assert.equal(depths['a.ts'], 0);
  assert.equal(depths['b.ts'], 1);
  assert.equal(depths['c.ts'], 1);
  assert.equal(depths['d.ts'], 2);
});
