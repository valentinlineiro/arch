# Auto Context Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a structural context index built on `arch govern` and a lookup engine that automatically writes `### Relevant Context` (files, ADRs, guidelines) into task files when `arch task start` is run.

**Architecture:** Two-phase system — `BuildIndex` compiles a structural snapshot of the repo into `.arch/context-index.json` (git-tracked), `ContextInference` queries it at `IN_PROGRESS` transition time using keyword scoring with edge-type and criticality multipliers. No runtime file scanning. Graceful degradation when index absent.

**Tech Stack:** TypeScript (ESM/NodeNext), Node.js built-in test runner (`node:test`, `node:assert`), regex-based AST extraction (no new npm dependencies).

---

## File Map

**New files:**
- `cli/src/main/ts/domain/models/context-index.ts` — `ContextIndex`, `FileEntry`, `AdrEntry`, `GuidelineEntry` interfaces
- `cli/src/main/ts/application/use-cases/build-index.ts` — `BuildIndex` use case: scans TS files, ADRs, guidelines; writes `.arch/context-index.json`
- `cli/src/main/ts/application/use-cases/context-inference.ts` — `ContextInference` use case: reads index, scores against task keywords, writes `### Relevant Context` section
- `cli/src/main/ts/application/commands/index-command.ts` — `IndexCommand`: surfaces `BuildIndex` as `arch index`
- `cli/src/test/ts/build-index.test.ts` — tests for `BuildIndex`
- `cli/src/test/ts/context-inference.test.ts` — tests for `ContextInference`

**Modified files:**
- `arch.config.json` — add `contextRules` field mapping guideline filenames to task classes
- `cli/src/main/ts/application/commands/govern-command.ts` — store `fileSystem` + `gitRepository` as private fields; call `BuildIndex` + git add + commit at end of `execute()`
- `cli/src/main/ts/application/commands/task-command.ts` — store `fileSystem` as private field; call `ContextInference` after `markInProgress.execute()` succeeds
- `cli/src/main/ts/index.ts` — register `index` command

---

## Task 1: ContextIndex domain model

**Files:**
- Create: `cli/src/main/ts/domain/models/context-index.ts`
- Create: `cli/src/test/ts/build-index.test.ts` (initial skeleton only)

- [ ] **Step 1: Write failing test**

Create `cli/src/test/ts/build-index.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry } from '../../main/ts/domain/models/context-index.js';

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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd cli && npm test 2>&1 | grep -A 3 "ContextIndex types"
```

Expected: FAIL with `Cannot find module '../../main/ts/domain/models/context-index.js'`

- [ ] **Step 3: Create the domain model**

Create `cli/src/main/ts/domain/models/context-index.ts`:

```typescript
export interface FileEntry {
  symbols: string[];
  imports: string[];
  tags: string[];
  criticality: 'core' | 'domain' | 'support' | 'utility';
  runtimeUsage: 'hot' | 'warm' | 'cold';
}

export interface AdrEntry {
  title: string;
  keywords: string[];
  affectedModules: string[];
  strength: 'enforced' | 'advisory';
}

export interface GuidelineEntry {
  tags: string[];
  taskClasses: string[];
}

export interface ContextIndex {
  version: number;
  builtAt: string;
  files: Record<string, FileEntry>;
  adrs: Record<string, AdrEntry>;
  guidelines: Record<string, GuidelineEntry>;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd cli && npm test 2>&1 | grep -A 3 "ContextIndex types"
```

Expected: `✔ ContextIndex types are importable and structurally correct`

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/models/context-index.ts cli/src/test/ts/build-index.test.ts
git commit -m "feat: [TASK-XXX] add ContextIndex domain model"
```

(Replace `TASK-XXX` with the task implementing this feature.)

---

## Task 2: BuildIndex — file scanning and extraction

**Files:**
- Create: `cli/src/main/ts/application/use-cases/build-index.ts` (partial — no ADR/guideline indexing yet, no `execute()` yet)
- Modify: `cli/src/test/ts/build-index.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `cli/src/test/ts/build-index.test.ts`:

```typescript
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
import { Bar } from '../domain/bar.js';
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test 2>&1 | grep -E "(FAIL|Cannot find)" | head -5
```

Expected: FAIL with `Cannot find module '../../main/ts/application/use-cases/build-index.js'`

- [ ] **Step 3: Implement BuildIndex (file scanning methods only)**

Create `cli/src/main/ts/application/use-cases/build-index.ts`:

```typescript
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry } from '../../domain/models/context-index.js';

export class BuildIndex {
  private readonly indexPath = '.arch/context-index.json';
  private readonly srcRoot = 'cli/src/main/ts';
  private readonly adrDir = 'docs/adr';
  private readonly guidelinesDir = 'docs/guidelines';
  private readonly stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'for', 'that',
    'this', 'it', 'not', 'as', 'at', 'by', 'or', 'be', 'do', 'if', 'on',
    'we', 'so', 'can', 'its', 'all', 'with', 'but', 'use', 'new', 'from',
    'has', 'have', 'was', 'were', 'will', 'one', 'two', 'each', 'any',
  ]);

  constructor(private fileSystem: FileSystem) {}

  async execute(contextRules: Record<string, { taskClasses: string[] }> = {}): Promise<void> {
    const fileEntries = await this.buildFileIndex();
    const adrs = await this.buildAdrIndex();
    const guidelines = this.buildGuidelineIndex(contextRules);

    const index: ContextIndex = {
      version: 1,
      builtAt: new Date().toISOString(),
      files: fileEntries,
      adrs,
      guidelines,
    };

    await this.fileSystem.mkdir('.arch');
    await this.fileSystem.writeFile(this.indexPath, JSON.stringify(index, null, 2) + '\n');
  }

  private async buildFileIndex(): Promise<Record<string, FileEntry>> {
    const tsFiles = await this.findTsFiles(this.srcRoot);
    const entries: Record<string, FileEntry> = {};

    for (const filePath of tsFiles) {
      entries[filePath] = await this.extractFileEntry(filePath);
    }

    const depths = this.computeImportDepths(entries, `${this.srcRoot}/index.ts`);
    for (const [filePath, depth] of Object.entries(depths)) {
      if (entries[filePath]) {
        entries[filePath].runtimeUsage = depth <= 2 ? 'hot' : depth <= 4 ? 'warm' : 'cold';
      }
    }

    return entries;
  }

  private async findTsFiles(dir: string): Promise<string[]> {
    const result: string[] = [];
    const skip = new Set(['node_modules', 'dist', '.git', 'test']);
    let entries: string[];
    try {
      entries = await this.fileSystem.readDirectory(dir);
    } catch {
      return result;
    }
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const fullPath = `${dir}/${entry}`;
      if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        result.push(fullPath);
      } else if (!entry.includes('.')) {
        result.push(...await this.findTsFiles(fullPath));
      }
    }
    return result;
  }

  private async extractFileEntry(filePath: string): Promise<FileEntry> {
    let content = '';
    try {
      content = await this.fileSystem.readFile(filePath);
    } catch {
      return { symbols: [], imports: [], tags: [], criticality: 'utility', runtimeUsage: 'cold' };
    }
    const symbols = this.extractSymbols(content);
    const imports = this.extractImports(content, filePath);
    const tags = this.extractTags(filePath, symbols);
    const criticality = this.inferCriticality(filePath);
    return { symbols, imports, tags, criticality, runtimeUsage: 'cold' };
  }

  extractSymbols(content: string): string[] {
    const pattern = /export\s+(?:abstract\s+)?(?:class|function|interface|type|enum|const|default\s+class)\s+(\w+)/g;
    return [...new Set([...content.matchAll(pattern)].map(m => m[1]))];
  }

  extractImports(content: string, filePath: string): string[] {
    const dir = filePath.split('/').slice(0, -1).join('/');
    const pattern = /from\s+['"](\.[^'"]+)['"]/g;
    const results: string[] = [];
    for (const match of content.matchAll(pattern)) {
      const raw = match[1].replace(/\.js$/, '');
      const segments = `${dir}/${raw}`.split('/');
      const resolved: string[] = [];
      for (const seg of segments) {
        if (seg === '..') resolved.pop();
        else if (seg !== '.') resolved.push(seg);
      }
      results.push(resolved.join('/') + '.ts');
    }
    return [...new Set(results)];
  }

  extractTags(filePath: string, symbols: string[]): string[] {
    const tags = new Set<string>();
    const relative = filePath.replace(`${this.srcRoot}/`, '');
    const segments = relative.split('/');
    for (const seg of segments.slice(0, -1)) {
      const words = seg.split('-').filter(w => w.length > 2);
      words.forEach(w => tags.add(w.toLowerCase()));
    }
    const filename = segments[segments.length - 1].replace('.ts', '');
    filename.split('-').filter(w => w.length > 2).forEach(w => tags.add(w.toLowerCase()));
    for (const symbol of symbols) {
      this.splitCamelCase(symbol)
        .filter(w => w.length > 2)
        .forEach(w => tags.add(w.toLowerCase()));
    }
    return [...tags];
  }

  inferCriticality(filePath: string): 'core' | 'domain' | 'support' | 'utility' {
    if (filePath.includes('/domain/')) return 'core';
    if (filePath.includes('/application/')) return 'domain';
    if (filePath.includes('/infrastructure/')) return 'support';
    return 'utility';
  }

  computeImportDepths(entries: Record<string, FileEntry>, entryPoint: string): Record<string, number> {
    const depths: Record<string, number> = {};
    const queue: Array<[string, number]> = [[entryPoint, 0]];
    while (queue.length > 0) {
      const [file, depth] = queue.shift()!;
      if (depths[file] !== undefined) continue;
      depths[file] = depth;
      const entry = entries[file];
      if (entry) {
        for (const imp of entry.imports) {
          if (depths[imp] === undefined) queue.push([imp, depth + 1]);
        }
      }
    }
    return depths;
  }

  private async buildAdrIndex(): Promise<Record<string, AdrEntry>> {
    const adrs: Record<string, AdrEntry> = {};
    let files: string[];
    try {
      files = await this.fileSystem.readDirectory(this.adrDir);
    } catch {
      return adrs;
    }
    for (const file of files) {
      const match = file.match(/^(ADR-\d+)/);
      if (!match || !file.endsWith('.md')) continue;
      const adrId = match[1];
      try {
        const content = await this.fileSystem.readFile(`${this.adrDir}/${file}`);
        adrs[adrId] = this.parseAdr(content);
      } catch { /* skip unreadable ADRs */ }
    }
    return adrs;
  }

  parseAdr(content: string): AdrEntry {
    const titleMatch = content.match(/^#\s+ADR-\d+[:\s]+(.+)$/m);
    const title = titleMatch?.[1]?.trim() ?? '';
    const statusMatch = content.match(/\*\*Status:\*\*\s+(\w+)/);
    const strength: 'enforced' | 'advisory' = statusMatch?.[1] === 'ACCEPTED' ? 'enforced' : 'advisory';
    const firstSection = content.slice(0, 1000);
    const keywords = this.extractKeywords(title + ' ' + firstSection);
    const pathMatches = [...content.matchAll(/`(cli\/[^`]+\.ts)`/g)];
    const affectedModules = [...new Set(pathMatches.map(m => m[1]))];
    return { title, keywords, affectedModules, strength };
  }

  buildGuidelineIndex(contextRules: Record<string, { taskClasses: string[] }>): Record<string, GuidelineEntry> {
    const guidelines: Record<string, GuidelineEntry> = {};
    for (const [file, rule] of Object.entries(contextRules)) {
      const tags = file.replace('.md', '').split('-').filter(w => w.length > 2);
      guidelines[file] = { tags, taskClasses: rule.taskClasses };
    }
    return guidelines;
  }

  extractKeywords(text: string): string[] {
    return [...new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.stopwords.has(w))
    )];
  }

  private splitCamelCase(s: string): string[] {
    return s.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd cli && npm test 2>&1 | grep -E "(✔|✗|FAIL)" | grep -E "(extractSymbols|extractImports|inferCriticality|extractTags|computeImport)"
```

Expected: all 5 new tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/use-cases/build-index.ts cli/src/test/ts/build-index.test.ts
git commit -m "feat: [TASK-XXX] add BuildIndex file scanning and extraction methods"
```

---

## Task 3: BuildIndex — ADR + guideline indexing + execute() tests

**Files:**
- Modify: `cli/src/test/ts/build-index.test.ts`

The `execute()` method and ADR/guideline methods were implemented in Task 2. This task adds tests that verify their behavior end-to-end.

- [ ] **Step 1: Write failing tests for parseAdr, buildGuidelineIndex, and execute()**

Append to `cli/src/test/ts/build-index.test.ts`:

```typescript
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
  const adr = (builder as any).parseAdr(content);
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
  const adr = (builder as any).parseAdr(content);
  assert.equal(adr.strength, 'advisory');
});

test('BuildIndex.buildGuidelineIndex maps contextRules to GuidelineEntry', () => {
  const fs = new MockFileSystem();
  const builder = new BuildIndex(fs as any);
  const rules = {
    'testing-a-change.md': { taskClasses: ['2-code-generation', '7-operations'] },
    'versioning.md': { taskClasses: ['2-code-generation'] },
  };
  const guidelines = (builder as any).buildGuidelineIndex(rules);
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
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd cli && npm test 2>&1 | grep -E "(✔|✗)" | grep -E "(parseAdr|buildGuidelineIndex|execute)"
```

Expected: all 5 new tests pass (implementations were already written in Task 2).

- [ ] **Step 3: Commit**

```bash
git add cli/src/test/ts/build-index.test.ts
git commit -m "test: [TASK-XXX] add comprehensive BuildIndex tests"
```

---

## Task 4: ContextInference — keyword extraction, scoring, and confidence

**Files:**
- Create: `cli/src/main/ts/application/use-cases/context-inference.ts`
- Create: `cli/src/test/ts/context-inference.test.ts`

- [ ] **Step 1: Write failing tests**

Create `cli/src/test/ts/context-inference.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { ContextInference, type ContextResult } from '../../main/ts/application/use-cases/context-inference.js';
import type { ContextIndex } from '../../main/ts/domain/models/context-index.js';

class MockFileSystem {
  files: Record<string, string> = {};
  written: Record<string, string> = {};

  async readFile(path: string): Promise<string> {
    if (!(path in this.files)) throw new Error(`Not found: ${path}`);
    return this.files[path];
  }
  async writeFile(path: string, content: string): Promise<void> { this.written[path] = content; }
  async exists(path: string): Promise<boolean> { return path in this.files; }
  async readDirectory(): Promise<string[]> { return []; }
  async rename(): Promise<void> {}
  async mkdir(): Promise<void> {}
}

const FIXTURE_INDEX: ContextIndex = {
  version: 1,
  builtAt: '2026-05-07T00:00:00Z',
  files: {
    'cli/src/main/ts/domain/models/intent.ts': {
      symbols: ['Intent', 'IntentStatus', 'IntentOrigin'],
      imports: [],
      tags: ['domain', 'model', 'intent', 'status', 'origin'],
      criticality: 'core',
      runtimeUsage: 'hot',
    },
    'cli/src/main/ts/application/use-cases/capture-intent.ts': {
      symbols: ['CaptureIntent'],
      imports: ['cli/src/main/ts/domain/models/intent.ts'],
      tags: ['application', 'use-case', 'capture', 'intent'],
      criticality: 'domain',
      runtimeUsage: 'warm',
    },
    'cli/src/main/ts/infrastructure/filesystem/node-file-system.ts': {
      symbols: ['NodeFileSystem'],
      imports: [],
      tags: ['infrastructure', 'filesystem', 'node', 'file', 'system'],
      criticality: 'support',
      runtimeUsage: 'hot',
    },
  },
  adrs: {
    'ADR-002': {
      title: 'Context as a budget, not a default',
      keywords: ['context', 'budget', 'token', 'agent', 'cost'],
      affectedModules: [],
      strength: 'enforced',
    },
    'ADR-003': {
      title: 'Dispatch ephemeral agents',
      keywords: ['dispatch', 'ephemeral', 'agent', 'session'],
      affectedModules: [],
      strength: 'advisory',
    },
  },
  guidelines: {
    'testing-a-change.md': { tags: ['testing', 'change', 'validation'], taskClasses: ['2-code-generation'] },
    'versioning.md': { tags: ['versioning', 'schema', 'migration'], taskClasses: ['2-code-generation'] },
    'autonomy.md': { tags: ['autonomy', 'agent', 'loop'], taskClasses: ['7-operations'] },
  },
};

test('ContextInference.extractKeywords removes stopwords and splits camelCase', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const keywords = (inference as any).extractKeywords('Add CaptureIntent use case for intent capture');
  assert.ok(keywords.includes('capture'));
  assert.ok(keywords.includes('intent'));
  assert.ok(!keywords.includes('add'));
  assert.ok(!keywords.includes('for'));
  assert.ok(!keywords.includes('use'));
});

test('ContextInference scores files by symbol and tag match', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result = (inference as any).score(FIXTURE_INDEX, ['intent', 'capture', 'status'], '2-code-generation');
  const filePaths = result.files.map((f: any) => f.path);
  // intent.ts and capture-intent.ts should score highly for these keywords
  assert.ok(filePaths.includes('cli/src/main/ts/domain/models/intent.ts'));
  assert.ok(filePaths.includes('cli/src/main/ts/application/use-cases/capture-intent.ts'));
  // node-file-system.ts has no relevant matches
  assert.ok(!filePaths.includes('cli/src/main/ts/infrastructure/filesystem/node-file-system.ts'));
});

test('ContextInference includes direct import neighbors of top files', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  // 'capture' keyword matches capture-intent.ts, which imports intent.ts
  // Even if intent.ts doesn't match 'capture' directly, it should appear via direct_import
  const result = (inference as any).score(FIXTURE_INDEX, ['capture'], '2-code-generation');
  const filePaths = result.files.map((f: any) => f.path);
  assert.ok(filePaths.includes('cli/src/main/ts/application/use-cases/capture-intent.ts'));
  // intent.ts is a direct import of capture-intent.ts — should be included
  assert.ok(filePaths.includes('cli/src/main/ts/domain/models/intent.ts'));
});

test('ContextInference ranks enforced ADRs before advisory ones', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  // Both 'context' and 'agent' match ADRs
  const result = (inference as any).score(FIXTURE_INDEX, ['context', 'agent', 'budget'], '2-code-generation');
  assert.ok(result.adrs.length > 0);
  // ADR-002 (enforced) should come before ADR-003 (advisory) if both match
  if (result.adrs.length >= 2) {
    assert.equal(result.adrs[0].id, 'ADR-002');
  }
});

test('ContextInference matches guidelines by task class', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result = (inference as any).score(FIXTURE_INDEX, ['some', 'task', 'keywords'], '2-code-generation');
  const guidelineNames = result.guidelines.map((g: any) => g.name);
  assert.ok(guidelineNames.includes('testing-a-change.md'));
  assert.ok(!guidelineNames.includes('autonomy.md')); // only for 7-operations
});

test('ContextInference confidence is between 0 and 1', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result = (inference as any).score(FIXTURE_INDEX, ['intent', 'capture'], '2-code-generation');
  assert.ok(result.confidence >= 0 && result.confidence <= 1, `confidence ${result.confidence} out of range`);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test 2>&1 | grep "Cannot find module.*context-inference"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ContextInference (scoring methods)**

Create `cli/src/main/ts/application/use-cases/context-inference.ts`:

```typescript
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { ContextIndex } from '../../domain/models/context-index.js';

export interface ScoredFile {
  path: string;
  score: number;
  criticality: string;
  runtimeUsage: string;
}

export interface ScoredAdr {
  id: string;
  title: string;
  strength: string;
  score: number;
}

export interface ScoredGuideline {
  name: string;
  score: number;
}

export interface ContextResult {
  confidence: number;
  files: ScoredFile[];
  adrs: ScoredAdr[];
  guidelines: ScoredGuideline[];
}

export class ContextInference {
  private readonly indexPath = '.arch/context-index.json';
  private readonly stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'for', 'that',
    'this', 'it', 'not', 'as', 'at', 'by', 'or', 'be', 'do', 'if', 'on',
    'we', 'so', 'can', 'its', 'all', 'with', 'but', 'use', 'new', 'from',
    'has', 'have', 'was', 'were', 'will', 'one', 'two', 'each', 'any', 'add',
  ]);

  constructor(private fileSystem: FileSystem) {}

  async execute(taskId: string, taskText: string, taskClass: string): Promise<void> {
    let index: ContextIndex;
    try {
      const raw = await this.fileSystem.readFile(this.indexPath);
      index = JSON.parse(raw) as ContextIndex;
    } catch {
      return; // Index absent — graceful skip
    }

    const keywords = this.extractKeywords(taskText);
    if (keywords.length === 0) return;

    const result = this.score(index, keywords, taskClass);
    const section = this.formatSection(result);

    const taskPath = `docs/tasks/${taskId}.md`;
    const content = await this.fileSystem.readFile(taskPath);
    const updated = this.insertSection(content, section);
    await this.fileSystem.writeFile(taskPath, updated);
  }

  extractKeywords(text: string): string[] {
    return [...new Set(
      text.toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !this.stopwords.has(w))
        .flatMap(w => this.splitCamelCase(w))
        .filter(w => w.length > 2 && !this.stopwords.has(w))
    )];
  }

  score(index: ContextIndex, keywords: string[], taskClass: string): ContextResult {
    const kw = new Set(keywords);
    const critMult: Record<string, number> = { core: 1.5, domain: 1.2, support: 1.0, utility: 0.7 };
    const usageMult: Record<string, number> = { hot: 1.3, warm: 1.0, cold: 0.7 };

    // Score files by symbol and tag match
    const fileScores: ScoredFile[] = [];
    for (const [filePath, entry] of Object.entries(index.files)) {
      let score = 0;
      for (const symbol of entry.symbols) {
        if (kw.has(symbol.toLowerCase())) score += 2.0;
        for (const part of this.splitCamelCase(symbol)) {
          if (kw.has(part) && part.length > 2) score += 1.5;
        }
      }
      for (const tag of entry.tags) {
        if (kw.has(tag)) score += 0.5;
      }
      if (score <= 0) continue;
      score *= (critMult[entry.criticality] ?? 1.0) * (usageMult[entry.runtimeUsage] ?? 1.0);
      fileScores.push({ path: filePath, score, criticality: entry.criticality, runtimeUsage: entry.runtimeUsage });
    }
    fileScores.sort((a, b) => b.score - a.score);
    const top5 = fileScores.slice(0, 5);

    // Expand with direct import neighbors of top-5 (direct_import weight = 3.0)
    const topPaths = new Set(top5.map(f => f.path));
    const neighborCandidates: ScoredFile[] = [];
    for (const { path: topPath } of top5) {
      const entry = index.files[topPath];
      if (!entry) continue;
      for (const imp of entry.imports) {
        if (topPaths.has(imp) || !index.files[imp]) continue;
        const impEntry = index.files[imp];
        const impScore = 3.0 * (critMult[impEntry.criticality] ?? 1.0) * (usageMult[impEntry.runtimeUsage] ?? 1.0);
        neighborCandidates.push({ path: imp, score: impScore, criticality: impEntry.criticality, runtimeUsage: impEntry.runtimeUsage });
        topPaths.add(imp);
      }
    }
    const allFiles = [...top5, ...neighborCandidates]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Score ADRs
    const adrScores: ScoredAdr[] = [];
    for (const [adrId, adr] of Object.entries(index.adrs)) {
      const matches = adr.keywords.filter(k => kw.has(k)).length;
      if (matches === 0) continue;
      let score = matches * (adr.strength === 'enforced' ? 1.5 : 1.0);
      adrScores.push({ id: adrId, title: adr.title, strength: adr.strength, score });
    }
    adrScores.sort((a, b) => {
      if (a.strength !== b.strength) return a.strength === 'enforced' ? -1 : 1;
      return b.score - a.score;
    });
    const topAdrs = adrScores.slice(0, 3);

    // Score guidelines by task class + tag match
    const guidelineScores: ScoredGuideline[] = [];
    for (const [name, g] of Object.entries(index.guidelines)) {
      let score = g.taskClasses.includes(taskClass) ? 2.0 : 0;
      score += g.tags.filter(t => kw.has(t)).length * 0.5;
      if (score <= 0) continue;
      guidelineScores.push({ name, score });
    }
    guidelineScores.sort((a, b) => b.score - a.score);
    const topGuidelines = guidelineScores.slice(0, 2);

    // Compute confidence
    const kwArray = [...kw];
    const matchedKw = kwArray.filter(k =>
      Object.values(index.files).some(f => f.tags.includes(k) || f.symbols.some(s => s.toLowerCase() === k))
    );
    const overlapDensity = kwArray.length > 0 ? matchedKw.length / kwArray.length : 0;
    const enforcedFraction = topAdrs.length > 0
      ? topAdrs.filter(a => a.strength === 'enforced').length / topAdrs.length
      : 0;
    const filePaths = new Set(allFiles.map(f => f.path));
    let mutualEdges = 0;
    for (const { path } of allFiles) {
      const entry = index.files[path];
      if (entry) entry.imports.forEach(imp => { if (filePaths.has(imp)) mutualEdges++; });
    }
    const maxEdges = allFiles.length * (allFiles.length - 1);
    const graphCoherence = maxEdges > 0 ? Math.min(mutualEdges / maxEdges, 1) : 0;
    const confidence = Math.min(overlapDensity * 0.4 + enforcedFraction * 0.35 + graphCoherence * 0.25, 1);

    return { confidence, files: allFiles, adrs: topAdrs, guidelines: topGuidelines };
  }

  formatSection(result: ContextResult): string {
    const conf = result.confidence.toFixed(2);
    const lines: string[] = [`### Relevant Context`, `_confidence: ${conf}_`, ''];

    if (result.files.length > 0) {
      lines.push('**Files:**');
      for (const f of result.files) {
        lines.push(`- ${f.path} _(${f.criticality}, ${f.runtimeUsage})_`);
      }
      lines.push('');
    }

    if (result.adrs.length > 0) {
      lines.push('**ADRs:**');
      for (const a of result.adrs) {
        lines.push(`- ${a.id}: ${a.title} _(${a.strength})_`);
      }
      lines.push('');
    }

    if (result.guidelines.length > 0) {
      lines.push('**Guidelines:**');
      for (const g of result.guidelines) {
        lines.push(`- ${g.name}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  insertSection(content: string, section: string): string {
    // Remove existing Relevant Context section if present
    const cleaned = content.replace(/\n### Relevant Context\n[\s\S]*?(?=\n###|\n##|$)/, '');

    // Insert after ### Context section if present
    const contextIdx = cleaned.indexOf('\n### Context\n');
    if (contextIdx !== -1) {
      const nextSection = cleaned.indexOf('\n###', contextIdx + 1);
      if (nextSection !== -1) {
        return cleaned.slice(0, nextSection) + '\n\n' + section + cleaned.slice(nextSection);
      }
    }

    // Otherwise insert before ### Acceptance Criteria
    const acIdx = cleaned.indexOf('\n### Acceptance Criteria');
    if (acIdx !== -1) {
      return cleaned.slice(0, acIdx) + '\n\n' + section + cleaned.slice(acIdx);
    }

    return cleaned.trimEnd() + '\n\n' + section + '\n';
  }

  private splitCamelCase(s: string): string[] {
    return s.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/).filter(Boolean);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd cli && npm test 2>&1 | grep -E "(✔|✗)" | grep -E "(extractKeywords|scores files|direct import|enforced|task class|confidence)"
```

Expected: all 6 new tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/use-cases/context-inference.ts cli/src/test/ts/context-inference.test.ts
git commit -m "feat: [TASK-XXX] add ContextInference scoring and keyword extraction"
```

---

## Task 5: ContextInference — write-back and execute() tests

**Files:**
- Modify: `cli/src/test/ts/context-inference.test.ts`

The `execute()`, `formatSection()`, and `insertSection()` methods were already implemented in Task 4. This task adds tests that verify their behavior.

- [ ] **Step 1: Write tests for write-back and execute()**

Append to `cli/src/test/ts/context-inference.test.ts`:

```typescript
test('ContextInference.formatSection produces correct markdown structure', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const result: ContextResult = {
    confidence: 0.82,
    files: [{ path: 'cli/src/main/ts/domain/models/intent.ts', score: 4.5, criticality: 'core', runtimeUsage: 'hot' }],
    adrs: [{ id: 'ADR-002', title: 'Context as a budget', strength: 'enforced', score: 3 }],
    guidelines: [{ name: 'testing-a-change.md', score: 2 }],
  };
  const section = inference.formatSection(result);
  assert.ok(section.includes('### Relevant Context'));
  assert.ok(section.includes('_confidence: 0.82_'));
  assert.ok(section.includes('cli/src/main/ts/domain/models/intent.ts'));
  assert.ok(section.includes('_(core, hot)_'));
  assert.ok(section.includes('ADR-002: Context as a budget _(enforced)_'));
  assert.ok(section.includes('- testing-a-change.md'));
});

test('ContextInference.insertSection inserts after ### Context when present', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const content = `## TASK-001: Title\n**Meta:** ...\n\n### Context\nSome context here.\n\n### Acceptance Criteria\n- [ ] AC1\n`;
  const section = '### Relevant Context\n_confidence: 0.75_\n';
  const updated = inference.insertSection(content, section);
  const contextIdx = updated.indexOf('### Context');
  const relevantIdx = updated.indexOf('### Relevant Context');
  const acIdx = updated.indexOf('### Acceptance Criteria');
  assert.ok(contextIdx < relevantIdx, 'Relevant Context should come after Context');
  assert.ok(relevantIdx < acIdx, 'Relevant Context should come before Acceptance Criteria');
});

test('ContextInference.insertSection inserts before ### Acceptance Criteria when no ### Context', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const content = `## TASK-001: Title\n**Meta:** ...\n\n### Acceptance Criteria\n- [ ] AC1\n`;
  const section = '### Relevant Context\n_confidence: 0.60_\n';
  const updated = inference.insertSection(content, section);
  assert.ok(updated.indexOf('### Relevant Context') < updated.indexOf('### Acceptance Criteria'));
});

test('ContextInference.insertSection replaces existing Relevant Context section', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);
  const content = `## TASK-001\n\n### Relevant Context\n_confidence: 0.50_\n\n**Files:**\n- old-file.ts\n\n### Acceptance Criteria\n- [ ] AC1\n`;
  const section = '### Relevant Context\n_confidence: 0.80_\n\n**Files:**\n- new-file.ts\n';
  const updated = inference.insertSection(content, section);
  assert.ok(!updated.includes('old-file.ts'), 'old content should be replaced');
  assert.ok(updated.includes('new-file.ts'), 'new content should be present');
  assert.equal((updated.match(/### Relevant Context/g) ?? []).length, 1, 'only one section');
});

test('ContextInference.execute() writes Relevant Context to task file', async () => {
  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = `## TASK-001: Add capture intent support\n**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n- [ ] implement CaptureIntent\n`;

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-001', 'Add capture intent support implement CaptureIntent capture intent flow', '2-code-generation');

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(written, 'task file should be written');
  assert.ok(written.includes('### Relevant Context'));
  assert.ok(written.includes('_confidence:'));
  assert.ok(written.includes('capture-intent.ts') || written.includes('intent.ts'));
});

test('ContextInference.execute() skips gracefully when index file does not exist', async () => {
  const fs = new MockFileSystem();
  fs.files['docs/tasks/TASK-001.md'] = `## TASK-001: Some task\n\n### Acceptance Criteria\n- [ ] AC\n`;
  // No .arch/context-index.json

  const inference = new ContextInference(fs as any);
  await assert.doesNotReject(() =>
    inference.execute('TASK-001', 'some task text', '2-code-generation')
  );
  assert.ok(!fs.written['docs/tasks/TASK-001.md'], 'task file should NOT be modified when index absent');
});
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd cli && npm test 2>&1 | grep -E "(✔|✗)" | grep -E "(formatSection|insertSection|execute.*writes|skips gracefully|replaces existing)"
```

Expected: all 6 new tests pass.

- [ ] **Step 3: Run full test suite**

```bash
cd cli && npm test 2>&1 | tail -10
```

Expected: all tests pass (no regressions).

- [ ] **Step 4: Commit**

```bash
git add cli/src/test/ts/context-inference.test.ts
git commit -m "test: [TASK-XXX] add ContextInference write-back and execute() tests"
```

---

## Task 6: arch index command + GovernCommand hook + contextRules in arch.config.json

**Files:**
- Create: `cli/src/main/ts/application/commands/index-command.ts`
- Modify: `cli/src/main/ts/application/commands/govern-command.ts`
- Modify: `arch.config.json`
- Modify: `cli/src/main/ts/index.ts`

- [ ] **Step 1: Create IndexCommand**

Create `cli/src/main/ts/application/commands/index-command.ts`:

```typescript
import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

export class IndexCommand {
  constructor(private fileSystem: FileSystem) {}

  async execute(): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);
    const contextRules = (config.contextRules as Record<string, { taskClasses: string[] }>) ?? {};
    const buildIndex = new BuildIndex(this.fileSystem);
    await buildIndex.execute(contextRules);
    console.log('  \x1b[32m✔\x1b[0m context index rebuilt → .arch/context-index.json');
  }
}
```

- [ ] **Step 2: Add contextRules to arch.config.json**

Open `arch.config.json` and add the `contextRules` field after the `"paths"` block:

```json
  "contextRules": {
    "testing-a-change.md": { "taskClasses": ["2-code-generation", "7-operations"] },
    "versioning.md": { "taskClasses": ["2-code-generation"] },
    "core.md": { "taskClasses": ["2-code-generation", "6-writing", "7-operations"] },
    "models.md": { "taskClasses": ["2-code-generation"] },
    "autonomy.md": { "taskClasses": ["7-operations"] },
    "bugs.md": { "taskClasses": ["2-code-generation", "7-operations"] },
    "resources.md": { "taskClasses": ["2-code-generation", "7-operations"] },
    "documentation.md": { "taskClasses": ["6-writing"] }
  },
```

- [ ] **Step 3: Update GovernCommand to store fields and call BuildIndex**

Replace the contents of `cli/src/main/ts/application/commands/govern-command.ts` with:

```typescript
import { GovernSystem } from '../use-cases/govern-system.js';
import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

export class GovernCommand {
  private useCase: GovernSystem;

  constructor(
    taskRepository: TaskRepository,
    private gitRepository: GitRepository,
    private fileSystem: FileSystem
  ) {
    this.useCase = new GovernSystem(taskRepository, gitRepository, fileSystem);
  }

  async execute(args: string[] = []): Promise<void> {
    const noConduct = args.includes('--no-conduct');
    console.log('\n  ARCH — Governance Tick');
    await this.useCase.execute(noConduct);

    // Rebuild context index after every successful govern tick
    try {
      const config = await ConfigLoader.load(this.fileSystem);
      const contextRules = (config.contextRules as Record<string, { taskClasses: string[] }>) ?? {};
      const buildIndex = new BuildIndex(this.fileSystem);
      await buildIndex.execute(contextRules);
      await this.gitRepository.add('.arch/context-index.json');
      await this.gitRepository.commit('chore: [THINK] rebuild context index');
      console.log('  \x1b[32m✔\x1b[0m context index rebuilt');
    } catch {
      // Nothing changed or git not available — acceptable
    }

    console.log('');
  }
}
```

- [ ] **Step 4: Register arch index command in index.ts**

In `cli/src/main/ts/index.ts`, add the import after the CaptureCommand import:

```typescript
import { IndexCommand } from './application/commands/index-command.js';
```

Then add the case in the switch block (before `default:`):

```typescript
    case 'index':
      await new IndexCommand(fileSystem).execute();
      break;
```

Also update the usage string to include `index`:

```typescript
      console.log('Usage: arch [status|validate|review|task|inbox|next|version|govern|rank|batch|drain|conduct|promote|loop|sandbox|lint|mv|exec|merge-resolve|capture|index]');
```

- [ ] **Step 5: Build and smoke test**

```bash
cd /home/valentin/code/arch && npm run build --prefix cli 2>&1 | tail -5
node cli/dist/index.js index 2>&1
ls .arch/
```

Expected: build succeeds, `arch index` prints `✔ context index rebuilt → .arch/context-index.json`, `.arch/context-index.json` exists.

- [ ] **Step 6: Run full test suite**

```bash
cd cli && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add cli/src/main/ts/application/commands/index-command.ts \
        cli/src/main/ts/application/commands/govern-command.ts \
        cli/src/main/ts/index.ts \
        arch.config.json
git commit -m "feat: [TASK-XXX] add arch index command, hook BuildIndex into govern, add contextRules"
```

---

## Task 7: Hook ContextInference into arch task start

**Files:**
- Modify: `cli/src/main/ts/application/commands/task-command.ts`

- [ ] **Step 1: Write failing test**

Append to `cli/src/test/ts/context-inference.test.ts`:

```typescript
import { TaskCommand } from '../../main/ts/application/commands/task-command.js';
import type { TaskRepository } from '../../main/ts/domain/repositories/task-repository.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';
import { Reviewer } from '../../main/ts/domain/services/reviewer.js';
import { HumanCoordinationService } from '../../main/ts/domain/services/human-coordination-service.js';

class MockTaskRepository implements TaskRepository {
  tasks: Record<string, any> = {};
  saved: any[] = [];

  async getById(id: string) { return this.tasks[id] ?? null; }
  async save(task: any) { this.saved.push(task); this.tasks[task.id] = task; }
  async getAll() { return Object.values(this.tasks); }
  async getActive() { return Object.values(this.tasks); }
  async findReady() { return Object.values(this.tasks).filter((t: any) => t.status === TaskStatus.READY); }
  async getNextId() { return 'TASK-001'; }
}

class MockHumanCoordinationService {
  async notifyTaskStarted() {}
  async notifyTaskCompleted() {}
}

test('TaskCommand start writes Relevant Context to task file when index exists', async () => {
  const taskRepo = new MockTaskRepository();
  taskRepo.tasks['TASK-001'] = {
    id: 'TASK-001',
    title: 'Add capture intent for auth flow',
    status: TaskStatus.READY,
    class: '2-code-generation',
    content: '## TASK-001: Add capture intent for auth flow\n**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none\n\n### Acceptance Criteria\n- [ ] implement CaptureIntent\n',
    rawMetaLine: '**Meta:** P2 | S | READY | Focus:yes | 2-code-generation | claude-code | none',
    filePath: 'docs/tasks/TASK-001.md',
    focus: true,
    depends: [],
  };

  const fs = new MockFileSystem();
  fs.files['.arch/context-index.json'] = JSON.stringify(FIXTURE_INDEX);
  fs.files['docs/tasks/TASK-001.md'] = taskRepo.tasks['TASK-001'].content;

  const reviewer = new Reviewer();
  const hcs = new MockHumanCoordinationService() as any;
  const command = new TaskCommand(taskRepo as any, reviewer, hcs, fs as any, '.');
  await command.execute(['start', 'TASK-001']);

  const written = fs.written['docs/tasks/TASK-001.md'];
  assert.ok(written, 'task file should be written with Relevant Context');
  assert.ok(written.includes('### Relevant Context'), 'should include Relevant Context section');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd cli && npm test 2>&1 | grep -A 3 "Relevant Context to task file"
```

Expected: FAIL (task-command.ts doesn't call ContextInference yet).

- [ ] **Step 3: Modify TaskCommand to call ContextInference after task start**

In `cli/src/main/ts/application/commands/task-command.ts`:

Change the constructor parameter `fileSystem: FileSystem` to `private fileSystem: FileSystem`:

```typescript
  constructor(
    taskRepository: TaskRepository,
    reviewer: Reviewer,
    private humanCoordinationService: HumanCoordinationService,
    private fileSystem: FileSystem,
    rootPath: string,
  ) {
```

Add the import for `ContextInference` at the top of the file (after existing imports):

```typescript
import { ContextInference } from '../use-cases/context-inference.js';
```

Replace the `start` block in `execute()`:

```typescript
    if (subCommand === 'start' && taskId) {
      try {
        const task = await this.markInProgress.execute(taskId, 'cli');
        fmt.arrow(`marking ${taskId} as IN_PROGRESS`);

        // Run context inference — gracefully skips if index absent
        try {
          const taskText = `${task.title} ${task.content}`;
          const inference = new ContextInference(this.fileSystem);
          await inference.execute(taskId, taskText, task.class ?? '');
        } catch { /* inference errors must never block task start */ }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd cli && npm test 2>&1 | grep -A 2 "Relevant Context to task file"
```

Expected: `✔ TaskCommand start writes Relevant Context to task file when index exists`

- [ ] **Step 5: Run full test suite**

```bash
cd cli && npm test 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 6: Build and end-to-end smoke test**

```bash
cd /home/valentin/code/arch
npm run build --prefix cli 2>&1 | tail -3
# Build the index first
node cli/dist/index.js index
# Start a READY task to trigger inference (use a real READY task ID from docs/tasks/)
# Replace TASK-XXX with an actual READY task
ls docs/tasks/*.md | head -3
```

Expected: `arch index` succeeds and `.arch/context-index.json` contains a valid JSON object with `files`, `adrs`, and `guidelines` keys.

- [ ] **Step 7: Commit**

```bash
git add cli/src/main/ts/application/commands/task-command.ts cli/src/test/ts/context-inference.test.ts
git commit -m "feat: [TASK-XXX] hook ContextInference into arch task start"
```

---

## Final verification

- [ ] **Verify .arch/context-index.json is tracked in git**

```bash
git add .arch/context-index.json
git status .arch/
```

Expected: `.arch/context-index.json` is staged (new file). Commit it:

```bash
git commit -m "chore: [TASK-XXX] track initial context index artifact"
```

- [ ] **Run arch review**

```bash
node cli/dist/index.js review 2>&1 | tail -20
```

Expected: no new violations introduced by these changes (pre-existing warnings remain).

- [ ] **Run full test suite one final time**

```bash
cd cli && npm test 2>&1 | tail -10
```

Expected: all tests pass.
