# Automatic Entity Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize task↔commit relationships from git history into the ContextIndex so that ContextInference can surface causally relevant files when a new task explicitly references prior tasks.

**Architecture:** Three additions working together — `TaskEntry` in the data model, a `buildTaskIndex()` three-stage pipeline in `BuildIndex`, and a task-reference second pass in `ContextInference.score()`. All passes accumulate into a shared score `Map` before sorting, so pass order is irrelevant. The `normalizeCommits()` pure function is the only new testable logic that doesn't need git infrastructure.

**Tech Stack:** TypeScript, Node.js `node:test` + `node:assert`, existing `MockFileSystem` pattern, `SubprocessRunner.runWithOutput` for git calls.

---

## File Map

| File | Change |
|------|--------|
| `cli/src/main/ts/domain/models/context-index.ts` | Add `TaskEntry` interface; add `tasks` field to `ContextIndex`; bump `version` to 2 |
| `cli/src/main/ts/domain/repositories/git-repository.ts` | Add `getCommitHistory()` method to interface |
| `cli/src/main/ts/infrastructure/cli/git-cli.ts` | Implement `getCommitHistory()` |
| `cli/src/main/ts/application/use-cases/build-index.ts` | Add required `gitRepository` param; add `buildTaskIndex()` + `normalizeCommits()` |
| `cli/src/main/ts/application/use-cases/context-inference.ts` | Refactor `score()` to shared Map; add task-reference pass; add `LOW_SIGNAL_PATTERNS`; extend `ContextResult` |
| `cli/src/main/ts/application/commands/govern-command.ts` | Pass `gitRepository` to `BuildIndex.execute()` |
| `cli/src/main/ts/application/commands/index-command.ts` | Inject `GitRepository`; pass it to `BuildIndex.execute()` |
| `cli/src/main/ts/index.ts` | Pass `gitRepository` to `new IndexCommand()` |
| `cli/src/test/ts/build-index.test.ts` | New tests for `normalizeCommits` and `buildTaskIndex` aggregate logic |
| `cli/src/test/ts/context-inference.test.ts` | New tests for task-reference pass, `filteredFiles`, `unresolvedTaskRefs` |
| `docs/tasks/TASK-217.md` | New ARCH task tracking this work |

---

## Task 1: Create TASK-217

**Files:**
- Create: `docs/tasks/TASK-217.md`

- [ ] **Step 1: Create the task file**

```markdown
## TASK-217: Automatic entity linking — tasks↔commits
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-210

### Context
Materialize task↔commit relationships from git history into the ContextIndex so ContextInference can surface causally relevant files when a task text references prior TASK-IDs.

Design: docs/superpowers/specs/2026-05-08-automatic-entity-linking-design.md

### Acceptance Criteria
- [ ] `TaskEntry` interface exists in `context-index.ts` with `commitCount`, `lastCommitDate`, `touchedFrequency`, `recentCommitRefs`, `commitRefOverflow`
- [ ] `ContextIndex.tasks` field exists; version bumped to 2
- [ ] `GitRepository.getCommitHistory()` method added and implemented in `git-cli.ts`
- [ ] `BuildIndex.execute()` requires `gitRepository` as second parameter
- [ ] `normalizeCommits()` pure function extracts TASK-IDs from commit messages
- [ ] `buildTaskIndex()` three-stage pipeline builds `Record<string, TaskEntry>`
- [ ] `ContextResult` has `unresolvedTaskRefs` and `filteredFiles` fields
- [ ] `ContextInference.score()` accumulates all passes into shared Map; task-reference pass applies `DIRECT_TASK_REFERENCE_BOOST`
- [ ] `govern-command.ts`, `index-command.ts`, `index.ts` all updated to pass `gitRepository`
- [ ] All existing 216 tests pass; new tests cover `normalizeCommits` and task-reference scoring

### Definition of Done
- [ ] All ACs checked.
- [ ] `npm test` passes in `cli/`.
```

- [ ] **Step 2: Commit**

```bash
git add docs/tasks/TASK-217.md
git commit -m "feat: [TASK-217] create task for automatic entity linking"
```

---

## Task 2: Add `TaskEntry` to `context-index.ts` and bump version

**Files:**
- Modify: `cli/src/main/ts/domain/models/context-index.ts`
- Modify: `cli/src/test/ts/build-index.test.ts`

- [ ] **Step 1: Write a failing test**

In `cli/src/test/ts/build-index.test.ts`, add after the existing imports:

```typescript
import type { TaskEntry } from '../../main/ts/domain/models/context-index.js';
```

Add this test at the bottom of the file:

```typescript
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
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A3 "TaskEntry and ContextIndex"
```

Expected: compile error or assertion failure — `TaskEntry` not defined yet.

- [ ] **Step 3: Implement the change**

Replace the entire contents of `cli/src/main/ts/domain/models/context-index.ts`:

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

export interface TaskEntry {
  commitCount: number;
  lastCommitDate: string;                    // ISO committer date of most recent task-linked commit
  touchedFrequency: Record<string, number>;  // file path → commit count; unfiltered raw provenance
  recentCommitRefs: string[];                // short SHAs, bounded to MAX_COMMIT_REFS
  commitRefOverflow: boolean;                // true when commitCount > MAX_COMMIT_REFS
}

export interface ContextIndex {
  version: number;
  builtAt: string;
  files: Record<string, FileEntry>;
  adrs: Record<string, AdrEntry>;
  guidelines: Record<string, GuidelineEntry>;
  tasks: Record<string, TaskEntry>;
}
```

- [ ] **Step 4: Run all tests**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | tail -10
```

Expected: all tests pass (existing 216 + the new structural test = 217).

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/models/context-index.ts cli/src/test/ts/build-index.test.ts
git commit -m "feat: [TASK-217] add TaskEntry to ContextIndex, bump version to 2"
```

---

## Task 3: Add `getCommitHistory()` to `GitRepository` interface and implement in `git-cli.ts`

**Files:**
- Modify: `cli/src/main/ts/domain/repositories/git-repository.ts`
- Modify: `cli/src/main/ts/infrastructure/cli/git-cli.ts`

No unit test is written for `GitCli.getCommitHistory()` directly — it shells out to `git` and is integration-only. The pure parsing logic will be tested as part of `normalizeCommits` in Task 4.

- [ ] **Step 1: Add `getCommitHistory()` to the interface**

In `cli/src/main/ts/domain/repositories/git-repository.ts`, add the method at the end of the interface body (before the closing `}`):

```typescript
  getCommitHistory(limit?: number): Promise<Array<{
    hash: string;
    message: string;
    date: string;
    files: string[];
  }>>;
```

- [ ] **Step 2: Verify tests still compile**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "error TS|failing|passed"
```

Expected: TypeScript will now complain that `GitCli` does not implement `getCommitHistory`. That's expected at this point.

- [ ] **Step 3: Implement `getCommitHistory()` in `git-cli.ts`**

In `cli/src/main/ts/infrastructure/cli/git-cli.ts`, add the following method at the end of the `GitCli` class body (before the final `}`):

```typescript
  async getCommitHistory(limit = 500): Promise<Array<{
    hash: string;
    message: string;
    date: string;
    files: string[];
  }>> {
    const { stdout, code } = await SubprocessRunner.runWithOutput('git', [
      'log',
      `--format=%h|%s|%cI`,
      '--name-only',
      `-${limit}`,
    ]);
    if (code !== 0 || !stdout.trim()) return [];

    const commits: Array<{ hash: string; message: string; date: string; files: string[] }> = [];
    const blocks = stdout.split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.trim().split('\n').filter(Boolean);
      if (lines.length === 0) continue;
      const headerLine = lines[0];
      const parts = headerLine.split('|');
      if (parts.length < 3) continue;
      const [hash, message, date] = parts;
      const files = lines.slice(1).map(l => l.trim()).filter(Boolean);
      commits.push({ hash: hash.trim(), message: message.trim(), date: date.trim(), files });
    }
    return commits;
  }
```

- [ ] **Step 4: Run all tests**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | tail -10
```

Expected: all tests pass (217 pass, 0 fail).

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/repositories/git-repository.ts cli/src/main/ts/infrastructure/cli/git-cli.ts
git commit -m "feat: [TASK-217] add getCommitHistory to GitRepository and GitCli"
```

---

## Task 4: Add `normalizeCommits()` and `buildTaskIndex()` to `BuildIndex`

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/build-index.ts`
- Modify: `cli/src/test/ts/build-index.test.ts`

This is the core logic task. `normalizeCommits()` is a pure function — test it exhaustively. `buildTaskIndex()` wires it to the three-stage pipeline.

- [ ] **Step 1: Write failing tests for `normalizeCommits()`**

Add these tests at the bottom of `cli/src/test/ts/build-index.test.ts`. First add the import at the top:

```typescript
import { normalizeCommits } from '../../main/ts/application/use-cases/build-index.js';
```

Then add the tests:

```typescript
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
```

- [ ] **Step 2: Write failing test for `BuildIndex.execute()` with task aggregation**

Add a MockGitRepository class to the test file (after MockFileSystem):

```typescript
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
```

Then add the test:

```typescript
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
  assert.ok(!task.touchedFrequency['src/d.ts']); // no-task commit not included
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
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "TASK-217|normalizeCommits|buildTaskIndex|passing|failing" | tail -20
```

Expected: compile errors (symbols not exported/found).

- [ ] **Step 4: Implement `normalizeCommits`, `buildTaskIndex`, and update `execute()`**

Replace `cli/src/main/ts/application/use-cases/build-index.ts` with the updated version below. Key changes: (1) add `gitRepository` as required second parameter to `execute()`; (2) export `normalizeCommits` pure function; (3) add private `buildTaskIndex()` method; (4) write `tasks` to the index; (5) bump `version` to 2.

```typescript
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import type { ContextIndex, FileEntry, AdrEntry, GuidelineEntry, TaskEntry } from '../../domain/models/context-index.js';

const GIT_LOG_DEPTH = 500;
const MAX_COMMIT_REFS = 20;

export function normalizeCommits(
  commits: Array<{ hash: string; message: string; date: string; files: string[] }>
): Array<{ taskIds: string[]; hash: string; date: string; files: string[] }> {
  return commits.map(c => ({
    taskIds: [...new Set((c.message.match(/TASK-\d+/g) ?? []))],
    hash: c.hash,
    date: c.date,
    files: c.files,
  }));
}

export class BuildIndex {
  private readonly indexPath = '.arch/context-index.json';
  private readonly srcRoot = 'cli/src/main/ts';
  private readonly adrDir = 'docs/adr';
  private readonly stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'for', 'that',
    'this', 'it', 'not', 'as', 'at', 'by', 'or', 'be', 'do', 'if', 'on',
    'we', 'so', 'can', 'its', 'all', 'with', 'but', 'use', 'new', 'from',
    'has', 'have', 'was', 'were', 'will', 'one', 'two', 'each', 'any',
  ]);

  constructor(private fileSystem: FileSystem) {}

  async execute(
    contextRules: Record<string, { taskClasses: string[] }>,
    gitRepository: GitRepository,
  ): Promise<void> {
    const fileEntries = await this.buildFileIndex();
    const adrs = await this.buildAdrIndex();
    const guidelines = this.buildGuidelineIndex(contextRules);
    const tasks = await this.buildTaskIndex(gitRepository);

    const index: ContextIndex = {
      version: 2,
      builtAt: new Date().toISOString(),
      files: fileEntries,
      adrs,
      guidelines,
      tasks,
    };

    await this.fileSystem.mkdir('.arch');
    await this.fileSystem.writeFile(this.indexPath, JSON.stringify(index, null, 2) + '\n');
  }

  private async buildTaskIndex(git: GitRepository): Promise<Record<string, TaskEntry>> {
    const rawCommits = await git.getCommitHistory(GIT_LOG_DEPTH);
    const normalized = normalizeCommits(rawCommits);

    const entries: Record<string, TaskEntry> = {};
    for (const { taskIds, hash, date, files } of normalized) {
      for (const id of taskIds) {
        if (!entries[id]) {
          entries[id] = {
            commitCount: 0,
            lastCommitDate: date,
            touchedFrequency: {},
            recentCommitRefs: [],
            commitRefOverflow: false,
          };
        }
        const entry = entries[id];
        entry.commitCount++;
        if (date > entry.lastCommitDate) entry.lastCommitDate = date;
        for (const file of files) {
          entry.touchedFrequency[file] = (entry.touchedFrequency[file] ?? 0) + 1;
        }
        if (entry.recentCommitRefs.length < MAX_COMMIT_REFS) {
          entry.recentCommitRefs.push(hash);
        } else {
          entry.commitRefOverflow = true;
        }
      }
    }

    return entries;
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
      const words = seg.split('-').filter(w => w.length >= 4);
      words.forEach(w => tags.add(w.toLowerCase()));
    }
    const filename = segments[segments.length - 1].replace('.ts', '');
    filename.split('-').filter(w => w.length >= 4).forEach(w => tags.add(w.toLowerCase()));
    for (const symbol of symbols) {
      this.splitCamelCase(symbol)
        .filter(w => w.length >= 4)
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
    const statusMatch =
      content.match(/\*\*Status:\*\*\s+(\w+)/) ??
      content.match(/##\s+Status\s*\n+(\w+)/);
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
      const tags = file.replace('.md', '').split('-').filter(w => w.length >= 4);
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

- [ ] **Step 5: Run all tests**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | tail -15
```

Expected: all tests pass including the new `normalizeCommits` and `buildTaskIndex` tests.

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/application/use-cases/build-index.ts cli/src/test/ts/build-index.test.ts
git commit -m "feat: [TASK-217] add buildTaskIndex and normalizeCommits to BuildIndex"
```

---

## Task 5: Extend `ContextInference` with task-reference second pass

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/context-inference.ts`
- Modify: `cli/src/test/ts/context-inference.test.ts`

This task is the scoring logic change. `ContextResult` gains two new fields. The keyword pass is refactored onto a shared `Map`. A second pass applies `DIRECT_TASK_REFERENCE_BOOST` for files touched by referenced tasks.

- [ ] **Step 1: Write failing tests**

Add to the bottom of `cli/src/test/ts/context-inference.test.ts`:

```typescript
const FIXTURE_INDEX_WITH_TASKS: ContextIndex = {
  version: 2,
  builtAt: '2026-05-08T00:00:00Z',
  files: {
    'cli/src/main/ts/domain/models/intent.ts': {
      symbols: ['Intent', 'IntentStatus'],
      imports: [],
      tags: ['domain', 'model', 'intent', 'status'],
      criticality: 'core',
      runtimeUsage: 'hot',
    },
    'cli/src/main/ts/application/use-cases/capture-intent.ts': {
      symbols: ['CaptureIntent'],
      imports: ['cli/src/main/ts/domain/models/intent.ts'],
      tags: ['application', 'capture', 'intent'],
      criticality: 'domain',
      runtimeUsage: 'warm',
    },
    'package-lock.json': {
      symbols: [],
      imports: [],
      tags: [],
      criticality: 'utility',
      runtimeUsage: 'cold',
    },
    'cli/src/test/ts/capture-intent.test.ts': {
      symbols: [],
      imports: [],
      tags: ['test', 'capture', 'intent'],
      criticality: 'utility',
      runtimeUsage: 'cold',
    },
  },
  adrs: {},
  guidelines: {},
  tasks: {
    'TASK-42': {
      commitCount: 2,
      lastCommitDate: '2026-05-08T10:00:00Z',
      touchedFrequency: {
        'cli/src/main/ts/domain/models/intent.ts': 2,
        'cli/src/main/ts/application/use-cases/capture-intent.ts': 1,
        'package-lock.json': 1,
        'cli/src/test/ts/capture-intent.test.ts': 1,
      },
      recentCommitRefs: ['abc1234'],
      commitRefOverflow: false,
    },
  },
};

test('ContextInference task-reference pass boosts files touched by referenced TASK-ID', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(FIXTURE_INDEX_WITH_TASKS, [], '2-code-generation', 'fix bug in TASK-42');

  const intentFile = result.files.find(f => f.path === 'cli/src/main/ts/domain/models/intent.ts');
  const captureFile = result.files.find(f => f.path === 'cli/src/main/ts/application/use-cases/capture-intent.ts');
  assert.ok(intentFile, 'intent.ts should be in results via task-reference pass');
  assert.ok(captureFile, 'capture-intent.ts should be in results via task-reference pass');
});

test('ContextInference task-reference pass filters LOW_SIGNAL_PATTERNS files', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(FIXTURE_INDEX_WITH_TASKS, [], '2-code-generation', 'fix bug in TASK-42');

  const lockFile = result.files.find(f => f.path === 'package-lock.json');
  assert.ok(!lockFile, 'package-lock.json should be filtered by LOW_SIGNAL_PATTERNS');
  assert.ok(result.filteredFiles.includes('package-lock.json'), 'package-lock.json should appear in filteredFiles');
});

test('ContextInference task-reference pass filters test files', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(FIXTURE_INDEX_WITH_TASKS, [], '2-code-generation', 'fix bug in TASK-42');

  const testFile = result.files.find(f => f.path === 'cli/src/test/ts/capture-intent.test.ts');
  assert.ok(!testFile, 'test files should be filtered by LOW_SIGNAL_PATTERNS');
  assert.ok(result.filteredFiles.includes('cli/src/test/ts/capture-intent.test.ts'));
});

test('ContextInference adds unresolved TASK-IDs to unresolvedTaskRefs', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  const result = inference.score(FIXTURE_INDEX_WITH_TASKS, [], '2-code-generation', 'implement TASK-999 feature');

  assert.ok(result.unresolvedTaskRefs.includes('TASK-999'));
});

test('ContextInference idempotency: same file from same task only gets boost once', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  // TASK-42 is mentioned twice — boost should only apply once
  const result = inference.score(FIXTURE_INDEX_WITH_TASKS, [], '2-code-generation', 'TASK-42 and TASK-42 again');

  const intentFile = result.files.find(f => f.path === 'cli/src/main/ts/domain/models/intent.ts');
  assert.ok(intentFile);
  // Score should be exactly DIRECT_TASK_REFERENCE_BOOST * criticality multiplier (1.5 for core)
  // not double that
  assert.ok(intentFile.score <= 4.0 * 1.5 + 0.1, `Expected score ~${4.0 * 1.5}, got ${intentFile.score}`);
});

test('ContextInference score() accumulates keyword and task-reference passes into shared map', () => {
  const fs = new MockFileSystem();
  const inference = new ContextInference(fs as any);

  // keywords match intent.ts + task-reference also touches intent.ts → score should be additive
  const result = inference.score(FIXTURE_INDEX_WITH_TASKS, ['intent'], '2-code-generation', 'TASK-42 intent fix');

  const intentFile = result.files.find(f => f.path === 'cli/src/main/ts/domain/models/intent.ts');
  assert.ok(intentFile);
  // Symbol match (2.0 * 1.5 = 3.0) + tag match (0.5 * 1.5 = 0.75) + boost (4.0 * 1.5 = 6.0) = 9.75
  // Accept any score > 6.0 to confirm additive accumulation
  assert.ok(intentFile.score > 6.0, `Expected additive score > 6.0, got ${intentFile.score}`);
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "filteredFiles|unresolvedTaskRefs|task-reference|passing|failing" | tail -20
```

Expected: TypeScript errors — `filteredFiles` and `unresolvedTaskRefs` not on `ContextResult`; `score()` signature mismatch.

- [ ] **Step 3: Implement the changes in `context-inference.ts`**

Replace the entire file:

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
  unresolvedTaskRefs: string[];
  filteredFiles: string[];
}

const DIRECT_TASK_REFERENCE_BOOST = 4.0;

const LOW_SIGNAL_PATTERNS: RegExp[] = [
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /README\.md$/i,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /\.eslintrc/,
  /\.prettierrc/,
  /tsconfig.*\.json$/,
  /CHANGELOG\.md$/i,
];

function isLowSignal(filePath: string): boolean {
  return LOW_SIGNAL_PATTERNS.some(p => p.test(filePath));
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
      return;
    }

    const keywords = this.extractKeywords(taskText);
    if (keywords.length === 0) return;

    const result = this.score(index, keywords, taskClass, taskText);
    const section = this.formatSection(result);

    const taskPath = `docs/tasks/${taskId}.md`;
    try {
      const content = await this.fileSystem.readFile(taskPath);
      const needsFeedback = !content.includes('### Context Feedback');
      const sectionWithFeedback = needsFeedback
        ? section + this.feedbackSection()
        : section;
      const updated = this.insertSection(content, sectionWithFeedback);
      await this.fileSystem.writeFile(taskPath, updated);
    } catch { /* task file unavailable — skip write-back */ }
  }

  extractKeywords(text: string): string[] {
    return [...new Set(
      text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .flatMap(w => this.splitCamelCase(w))
        .filter(w => w.length > 2 && !this.stopwords.has(w))
    )];
  }

  score(index: ContextIndex, keywords: string[], taskClass: string, taskText = ''): ContextResult {
    const kw = new Set(keywords);
    const critMult: Record<string, number> = { core: 1.5, domain: 1.2, support: 1.0, utility: 0.7 };
    const scoreMap = new Map<string, number>();

    // Keyword pass: score by symbol and tag match
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
      score *= (critMult[entry.criticality] ?? 1.0);
      scoreMap.set(filePath, (scoreMap.get(filePath) ?? 0) + score);
    }

    // Task-reference pass
    const unresolvedTaskRefs: string[] = [];
    const filteredFilesSet = new Set<string>();
    const taskIds = [...new Set((taskText.match(/TASK-\d+/g) ?? []))];
    for (const id of taskIds) {
      const entry = (index.tasks ?? {})[id];
      if (!entry) {
        unresolvedTaskRefs.push(id);
        continue;
      }
      for (const filePath of Object.keys(entry.touchedFrequency)) {
        if (isLowSignal(filePath)) {
          filteredFilesSet.add(filePath);
          continue;
        }
        const fileEntry = index.files[filePath];
        const mult = fileEntry ? (critMult[fileEntry.criticality] ?? 1.0) : 1.0;
        scoreMap.set(filePath, (scoreMap.get(filePath) ?? 0) + DIRECT_TASK_REFERENCE_BOOST * mult);
      }
    }

    // Build ScoredFile list from shared score map
    const allFilesRaw: ScoredFile[] = [];
    for (const [filePath, score] of scoreMap.entries()) {
      const entry = index.files[filePath];
      if (!entry) continue;
      allFilesRaw.push({ path: filePath, score, criticality: entry.criticality, runtimeUsage: entry.runtimeUsage });
    }
    allFilesRaw.sort((a, b) => b.score - a.score);
    const top5 = allFilesRaw.slice(0, 5);

    // Expand with direct import neighbors of top-5
    const topPaths = new Set(top5.map(f => f.path));
    const neighborCandidates: ScoredFile[] = [];
    for (const { path: topPath } of top5) {
      const entry = index.files[topPath];
      if (!entry) continue;
      for (const imp of entry.imports) {
        if (topPaths.has(imp) || !index.files[imp]) continue;
        const impEntry = index.files[imp];
        const impScore = 3.0 * (critMult[impEntry.criticality] ?? 1.0);
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
      const score = matches * (adr.strength === 'enforced' ? 1.5 : 1.0);
      adrScores.push({ id: adrId, title: adr.title, strength: adr.strength, score });
    }
    adrScores.sort((a, b) => {
      if (a.strength !== b.strength) return a.strength === 'enforced' ? -1 : 1;
      return b.score - a.score;
    });
    const topAdrs = adrScores.slice(0, 3);

    // Score guidelines
    const guidelineScores: ScoredGuideline[] = [];
    for (const [name, g] of Object.entries(index.guidelines)) {
      let score = g.taskClasses.includes(taskClass) ? 2.0 : 0;
      score += g.tags.filter(t => kw.has(t)).length * 0.5;
      if (score <= 0) continue;
      guidelineScores.push({ name, score });
    }
    guidelineScores.sort((a, b) => b.score - a.score);
    const topGuidelines = guidelineScores.slice(0, 2);

    // Confidence
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

    return {
      confidence,
      files: allFiles,
      adrs: topAdrs,
      guidelines: topGuidelines,
      unresolvedTaskRefs: [...new Set(unresolvedTaskRefs)],
      filteredFiles: [...filteredFilesSet],
    };
  }

  formatSection(result: ContextResult): string {
    const conf = result.confidence.toFixed(2);
    const lines: string[] = [`### Relevant Context`, `_confidence: ${conf}_`, ''];

    if (result.files.length > 0) {
      lines.push('**Files:**');
      for (const f of result.files) {
        lines.push(`- ${f.path} _(${f.criticality})_`);
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
    const cleaned = content.replace(/\n### Relevant Context\n[\s\S]*?(?=\n###|\n##|$)/, '');

    const contextIdx = cleaned.indexOf('\n### Context\n');
    if (contextIdx !== -1) {
      const nextSection = cleaned.indexOf('\n###', contextIdx + 1);
      if (nextSection !== -1) {
        return cleaned.slice(0, nextSection) + '\n\n' + section + cleaned.slice(nextSection);
      }
    }

    const feedbackIdx = cleaned.indexOf('\n### Context Feedback');
    if (feedbackIdx !== -1) {
      return cleaned.slice(0, feedbackIdx) + '\n\n' + section + cleaned.slice(feedbackIdx);
    }

    const acIdx = cleaned.indexOf('\n### Acceptance Criteria');
    if (acIdx !== -1) {
      return cleaned.slice(0, acIdx) + '\n\n' + section + cleaned.slice(acIdx);
    }

    return cleaned.trimEnd() + '\n\n' + section + '\n';
  }

  private feedbackSection(): string {
    return [
      '',
      '### Context Feedback',
      '_Was the Relevant Context above useful?_',
      '- [ ] accurate — files and ADRs were on-target',
      '- [ ] partial — correct direction, missing key files',
      '- [ ] off — wrong files dominated',
      '',
      '_If partial or off:_',
      '- [ ] wrong files',
      '- [ ] missing files',
      '- [ ] wrong ADRs',
      '- [ ] too much noise',
      '- [ ] confidence misleading',
      '',
    ].join('\n');
  }

  private splitCamelCase(s: string): string[] {
    return s.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/).filter(Boolean);
  }
}
```

- [ ] **Step 4: Run all tests**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/use-cases/context-inference.ts cli/src/test/ts/context-inference.test.ts
git commit -m "feat: [TASK-217] add task-reference pass and LOW_SIGNAL_PATTERNS to ContextInference"
```

---

## Task 6: Update call sites — `govern-command.ts`, `index-command.ts`, `index.ts`

**Files:**
- Modify: `cli/src/main/ts/application/commands/govern-command.ts`
- Modify: `cli/src/main/ts/application/commands/index-command.ts`
- Modify: `cli/src/main/ts/index.ts`

`BuildIndex.execute()` now requires `gitRepository` as a second argument. Three callers must be updated. The tests don't cover these commands directly via their `execute()` methods, but the TypeScript compiler will fail if the call sites don't match the signature.

- [ ] **Step 1: Update `govern-command.ts`**

In `cli/src/main/ts/application/commands/govern-command.ts`, change line 28 from:

```typescript
      await buildIndex.execute(contextRules);
```

to:

```typescript
      await buildIndex.execute(contextRules, this.gitRepository);
```

- [ ] **Step 2: Update `index-command.ts`**

Replace the entire file:

```typescript
import { BuildIndex } from '../use-cases/build-index.js';
import { ConfigLoader } from '../../domain/services/config-loader.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';

export class IndexCommand {
  constructor(
    private fileSystem: FileSystem,
    private gitRepository: GitRepository,
  ) {}

  async execute(): Promise<void> {
    const config = await ConfigLoader.load(this.fileSystem);
    const contextRules = (config.contextRules as Record<string, { taskClasses: string[] }>) ?? {};
    const buildIndex = new BuildIndex(this.fileSystem);
    await buildIndex.execute(contextRules, this.gitRepository);
    console.log('  \x1b[32m✔\x1b[0m context index rebuilt → .arch/context-index.json');
  }
}
```

- [ ] **Step 3: Update `index.ts`**

In `cli/src/main/ts/index.ts`, change line 127 from:

```typescript
      await new IndexCommand(fileSystem).execute();
```

to:

```typescript
      await new IndexCommand(fileSystem, gitRepository).execute();
```

- [ ] **Step 4: Run all tests**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/commands/govern-command.ts cli/src/main/ts/application/commands/index-command.ts cli/src/main/ts/index.ts
git commit -m "feat: [TASK-217] wire gitRepository into govern-command, index-command, and index.ts"
```

---

## Task 7: `arch review` and archive TASK-217

**Files:**
- Modify: `docs/tasks/TASK-217.md`
- Create: `docs/archive/TASK-217.md`

- [ ] **Step 1: Run final test suite and arch review**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | tail -5
cd /home/valentin/code/arch && arch review
```

Expected: all tests pass; arch review shows no new violations.

- [ ] **Step 2: Check off all ACs in TASK-217**

Update `docs/tasks/TASK-217.md`: mark all `- [ ]` Acceptance Criteria and Definition of Done items as `- [x]`.

- [ ] **Step 3: Archive the task**

```bash
arch task done TASK-217
```

or manually:

```bash
git mv docs/tasks/TASK-217.md docs/archive/TASK-217.md
git commit -m "chore: [TASK-217] archive - all ACs verified, arch review passes"
```

- [ ] **Step 4: Update ROADMAP.md**

In `docs/ROADMAP.md`, change the "Automatic entity linking" row status from `NOT STARTED` to `IN PROGRESS` (or `DONE` if this is the full Phase 1 scope):

Find this line:
```
| Automatic entity linking — tasks↔commits, ADRs↔tasks, guidelines↔failures | `NOT STARTED` | [IDEA-roadmap-automatic-linking](refinement/IDEA-roadmap-automatic-linking.md) |
```

Change to:
```
| Automatic entity linking — tasks↔commits, ADRs↔tasks, guidelines↔failures | `DONE` | [TASK-217](archive/TASK-217.md), [IDEA-roadmap-automatic-linking](refinement/IDEA-roadmap-automatic-linking.md) |
```

- [ ] **Step 5: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: [TASK-217] update ROADMAP — entity linking DONE"
```
