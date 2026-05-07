# arch capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `arch capture` — a signal ingestion primitive that writes INTENT files to `docs/intents/` with near-zero friction — and update the THINK protocol to process captured intents as its first phase.

**Architecture:** New `docs/intents/INTENT-NNN.md` entity with YAML frontmatter; `MarkdownIntentRepository` handles write + ID generation; `CaptureIntent` use case reads local git context and delegates to the repository; THINK.md gains Phase 1 (Intent Operationalization) before existing phases.

**Tech Stack:** TypeScript (ESM/NodeNext), Node.js built-in test runner (`node:test`, `node:assert`), no new npm dependencies.

---

## File Map

**New files:**
- `cli/src/main/ts/domain/models/intent.ts` — Intent type, IntentStatus enum, IntentOrigin interface
- `cli/src/main/ts/domain/repositories/intent-repository.ts` — IntentRepository interface
- `cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts` — MarkdownIntentRepository
- `cli/src/main/ts/application/use-cases/capture-intent.ts` — CaptureIntent use case
- `cli/src/main/ts/application/commands/capture-command.ts` — CaptureCommand
- `cli/src/test/ts/markdown-intent-repository.test.ts` — repository tests
- `cli/src/test/ts/capture-intent.test.ts` — use case tests

**Modified files:**
- `cli/src/main/ts/domain/repositories/file-system.ts` — add `mkdir`
- `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts` — implement `mkdir`
- `cli/src/main/ts/domain/repositories/git-repository.ts` — add `getStagedFiles`, `getModifiedFiles`, `getRepoRoot`
- `cli/src/main/ts/infrastructure/cli/git-cli.ts` — implement new git methods
- `cli/src/main/ts/index.ts` — register `capture` command
- `docs/agents/THINK.md` — add Phase 1: Intent Operationalization; renumber existing phases

---

## Task 1: Intent domain model

**Files:**
- Create: `cli/src/main/ts/domain/models/intent.ts`

- [ ] **Step 1: Write failing test**

Create `cli/src/test/ts/markdown-intent-repository.test.ts` with:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';

test('IntentStatus has all required values', () => {
  assert.equal(IntentStatus.CAPTURED, 'CAPTURED');
  assert.equal(IntentStatus.PROMOTED, 'PROMOTED');
  assert.equal(IntentStatus.SIGNAL, 'SIGNAL');
  assert.equal(IntentStatus.SUPERSEDED, 'SUPERSEDED');
  assert.equal(IntentStatus.DISCARDED, 'DISCARDED');
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd cli && npm test 2>&1 | grep -A3 "markdown-intent-repository"
```

Expected: error — module not found.

- [ ] **Step 3: Create the domain model**

Create `cli/src/main/ts/domain/models/intent.ts`:

```typescript
export enum IntentStatus {
  CAPTURED = 'CAPTURED',
  PROMOTED = 'PROMOTED',
  SIGNAL = 'SIGNAL',
  SUPERSEDED = 'SUPERSEDED',
  DISCARDED = 'DISCARDED',
}

export interface IntentOrigin {
  source: string;
  branch?: string;
  cwd?: string;
  triggeredBy: string;
  recentFiles: string[];
}

export interface Intent {
  id: string;
  schemaVersion: number;
  status: IntentStatus;
  createdAt: string;
  updatedAt: string;
  origin: IntentOrigin;
  interpretations: unknown[];
  promotedTo: string[];
  supersededBy: string[];
  rawIntent: string;
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
cd cli && npm test 2>&1 | grep -A3 "IntentStatus has all"
```

Expected: `✔ IntentStatus has all required values`

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/domain/models/intent.ts cli/src/test/ts/markdown-intent-repository.test.ts
git commit -m "feat: add Intent domain model"
```

---

## Task 2: FileSystem.mkdir + NodeFileSystem

**Files:**
- Modify: `cli/src/main/ts/domain/repositories/file-system.ts`
- Modify: `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts`

- [ ] **Step 1: Write failing test**

Add to `cli/src/test/ts/markdown-intent-repository.test.ts`:

```typescript
import { MarkdownIntentRepository } from '../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

class MockFileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  async readFile(path: string) { return this.files[path] ?? ''; }
  async writeFile(path: string, content: string) {
    this.files[path] = content;
    const dir = path.split('/').slice(0, -1).join('/');
    if (this.directories[dir]) this.directories[dir].push(path.split('/').pop()!);
  }
  async exists(path: string) { return path in this.files || path in this.directories; }
  async readDirectory(path: string) { return this.directories[path] ?? []; }
  async rename() {}
  async mkdir(path: string) { this.directories[path] = this.directories[path] ?? []; }
}

test('MarkdownIntentRepository - mkdir is called', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  // will fail until MarkdownIntentRepository exists
  assert.ok(repo);
});
```

- [ ] **Step 2: Run to confirm it fails**

```bash
cd cli && npm test 2>&1 | grep -A3 "mkdir is called"
```

Expected: error — module not found.

- [ ] **Step 3: Add mkdir to FileSystem interface**

In `cli/src/main/ts/domain/repositories/file-system.ts`:

```typescript
export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readDirectory(path: string): Promise<string[]>;
  rename(oldPath: string, newPath: string): Promise<void>;
  mkdir(path: string): Promise<void>;
}
```

- [ ] **Step 4: Implement in NodeFileSystem**

In `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts`, add after the existing `rename` method:

```typescript
async mkdir(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}
```

- [ ] **Step 5: Run full test suite to confirm no regressions**

```bash
cd cli && npm test 2>&1 | tail -20
```

Expected: all existing tests still pass. (MockFileSystem instances in other test files use `as any`, so TypeScript interface change does not break them at runtime.)

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/domain/repositories/file-system.ts cli/src/main/ts/infrastructure/filesystem/node-file-system.ts
git commit -m "feat: add mkdir to FileSystem interface and NodeFileSystem"
```

---

## Task 3: GitRepository extensions

**Files:**
- Modify: `cli/src/main/ts/domain/repositories/git-repository.ts`
- Modify: `cli/src/main/ts/infrastructure/cli/git-cli.ts`

- [ ] **Step 1: Add methods to GitRepository interface**

In `cli/src/main/ts/domain/repositories/git-repository.ts`:

```typescript
export interface GitRepository {
  getDiff(args?: string[]): Promise<string>;
  getLastCommitMessage(): Promise<string | null>;
  getCurrentBranch(): Promise<string>;
  getStatusLines(): Promise<string[]>;
  getLog(limit: number): Promise<string[]>;
  add(path: string): Promise<void>;
  rm(path: string): Promise<void>;
  mv(oldPath: string, newPath: string): Promise<void>;
  commit(message: string): Promise<void>;
  getFileLastModifiedDate(path: string): Promise<Date | null>;
  getChangedFilesInLastCommit(): Promise<string[]>;
  getMergeCommits(limit: number): Promise<string[]>;
  getStagedFiles(): Promise<string[]>;
  getModifiedFiles(): Promise<string[]>;
  getRepoRoot(): Promise<string>;
}
```

- [ ] **Step 2: Implement in GitCli**

In `cli/src/main/ts/infrastructure/cli/git-cli.ts`, add after `getMergeCommits`:

```typescript
async getStagedFiles(): Promise<string[]> {
  const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['diff', '--cached', '--name-only']);
  if (code !== 0) return [];
  return stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

async getModifiedFiles(): Promise<string[]> {
  const { stdout, code } = await SubprocessRunner.runWithOutput('git', ['diff', '--name-only']);
  if (code !== 0) return [];
  return stdout.split('\n').map(s => s.trim()).filter(Boolean);
}

async getRepoRoot(): Promise<string> {
  const { stdout } = await SubprocessRunner.runWithOutput('git', ['rev-parse', '--show-toplevel']);
  return stdout.trim();
}
```

- [ ] **Step 3: Run tests to confirm no regressions**

```bash
cd cli && npm test 2>&1 | tail -10
```

Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add cli/src/main/ts/domain/repositories/git-repository.ts cli/src/main/ts/infrastructure/cli/git-cli.ts
git commit -m "feat: add getStagedFiles, getModifiedFiles, getRepoRoot to GitRepository"
```

---

## Task 4: IntentRepository interface + MarkdownIntentRepository

**Files:**
- Create: `cli/src/main/ts/domain/repositories/intent-repository.ts`
- Create: `cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts`
- Modify: `cli/src/test/ts/markdown-intent-repository.test.ts`

- [ ] **Step 1: Write failing tests**

Replace the contents of `cli/src/test/ts/markdown-intent-repository.test.ts` with:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import { MarkdownIntentRepository } from '../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

class MockFileSystem {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  async readFile(path: string) { return this.files[path] ?? ''; }
  async writeFile(path: string, content: string) {
    this.files[path] = content;
    const dir = path.split('/').slice(0, -1).join('/');
    if (!this.directories[dir]) this.directories[dir] = [];
    this.directories[dir].push(path.split('/').pop()!);
  }
  async exists(path: string) { return path in this.files || path in this.directories; }
  async readDirectory(path: string) { return this.directories[path] ?? []; }
  async rename() {}
  async mkdir(path: string) { this.directories[path] = this.directories[path] ?? []; }
}

test('IntentStatus has all required values', () => {
  assert.equal(IntentStatus.CAPTURED, 'CAPTURED');
  assert.equal(IntentStatus.PROMOTED, 'PROMOTED');
  assert.equal(IntentStatus.SIGNAL, 'SIGNAL');
  assert.equal(IntentStatus.SUPERSEDED, 'SUPERSEDED');
  assert.equal(IntentStatus.DISCARDED, 'DISCARDED');
});

test('MarkdownIntentRepository.getNextId returns INTENT-001 when no intents exist', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  const id = await repo.getNextId();
  assert.equal(id, 'INTENT-001');
});

test('MarkdownIntentRepository.getNextId increments from existing files', async () => {
  const fs = new MockFileSystem();
  fs.directories['docs/intents'] = ['INTENT-001.md', 'INTENT-002.md'];
  const repo = new MarkdownIntentRepository(fs as any);
  const id = await repo.getNextId();
  assert.equal(id, 'INTENT-003');
});

test('MarkdownIntentRepository.save writes a file with correct frontmatter', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  await repo.save({
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-07T14:00:00.000Z',
    updatedAt: '2026-05-07T14:00:00.000Z',
    origin: { source: 'cli', branch: 'main', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: [] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'auth flow feels fragmented',
  });
  const content = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(content.includes('id: INTENT-001'));
  assert.ok(content.includes('status: CAPTURED'));
  assert.ok(content.includes('schema_version: 1'));
  assert.ok(content.includes('auth flow feels fragmented'));
});

test('MarkdownIntentRepository.save includes recent_files when provided', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  await repo.save({
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-07T14:00:00.000Z',
    updatedAt: '2026-05-07T14:00:00.000Z',
    origin: { source: 'cli', branch: 'feat/auth', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: ['cli/src/main.ts'] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'test intent',
  });
  const content = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(content.includes('- cli/src/main.ts'));
  assert.ok(content.includes('branch: feat/auth'));
});

test('MarkdownIntentRepository.save omits branch and cwd when undefined', async () => {
  const fs = new MockFileSystem();
  const repo = new MarkdownIntentRepository(fs as any);
  await repo.save({
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-07T14:00:00.000Z',
    updatedAt: '2026-05-07T14:00:00.000Z',
    origin: { source: 'cli', triggeredBy: 'capture', recentFiles: [] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'test',
  });
  const content = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(!content.includes('branch:'));
  assert.ok(!content.includes('cwd:'));
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd cli && npm test 2>&1 | grep -E "FAIL|Error" | head -5
```

Expected: errors — module not found.

- [ ] **Step 3: Create IntentRepository interface**

Create `cli/src/main/ts/domain/repositories/intent-repository.ts`:

```typescript
import type { Intent, IntentStatus } from '../models/intent.js';

export interface IntentRepository {
  getNextId(): Promise<string>;
  save(intent: Intent): Promise<void>;
}
```

- [ ] **Step 4: Create MarkdownIntentRepository**

Create `cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts`:

```typescript
import path from 'node:path';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { Intent } from '../../domain/models/intent.js';
import type { IntentRepository } from '../../domain/repositories/intent-repository.js';

export class MarkdownIntentRepository implements IntentRepository {
  private intentsDir = 'docs/intents';

  constructor(private fileSystem: FileSystem) {}

  async getNextId(): Promise<string> {
    if (!(await this.fileSystem.exists(this.intentsDir))) {
      return 'INTENT-001';
    }
    const files = await this.fileSystem.readDirectory(this.intentsDir);
    const ids = files
      .filter(f => /^INTENT-\d{3}\.md$/.test(f))
      .map(f => parseInt(f.replace('INTENT-', '').replace('.md', ''), 10));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `INTENT-${(maxId + 1).toString().padStart(3, '0')}`;
  }

  async save(intent: Intent): Promise<void> {
    await this.fileSystem.mkdir(this.intentsDir);
    const filePath = path.join(this.intentsDir, `${intent.id}.md`);
    await this.fileSystem.writeFile(filePath, this.serialize(intent));
  }

  private serialize(intent: Intent): string {
    const recentFilesYaml =
      intent.origin.recentFiles.length === 0
        ? '  recent_files: []'
        : '  recent_files:\n' +
          intent.origin.recentFiles.map(f => `    - ${f}`).join('\n');

    const lines: (string | null)[] = [
      '---',
      `id: ${intent.id}`,
      `schema_version: ${intent.schemaVersion}`,
      `status: ${intent.status}`,
      `created_at: ${intent.createdAt}`,
      `updated_at: ${intent.updatedAt}`,
      '',
      'origin:',
      `  source: ${intent.origin.source}`,
      intent.origin.branch != null ? `  branch: ${intent.origin.branch}` : null,
      intent.origin.cwd != null ? `  cwd: ${intent.origin.cwd}` : null,
      `  triggered_by: ${intent.origin.triggeredBy}`,
      recentFilesYaml,
      '',
      'interpretations: []',
      'promoted_to: []',
      'superseded_by: []',
      '---',
      '',
      intent.rawIntent,
    ];

    return lines.filter((l): l is string => l !== null).join('\n');
  }
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
cd cli && npm test 2>&1 | grep -E "✔|✗|FAIL" | grep -i intent
```

Expected: all 6 intent tests pass.

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/domain/repositories/intent-repository.ts cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts cli/src/test/ts/markdown-intent-repository.test.ts
git commit -m "feat: add IntentRepository interface and MarkdownIntentRepository"
```

---

## Task 5: CaptureIntent use case

**Files:**
- Create: `cli/src/main/ts/application/use-cases/capture-intent.ts`
- Create: `cli/src/test/ts/capture-intent.test.ts`

- [ ] **Step 1: Write failing tests**

Create `cli/src/test/ts/capture-intent.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { CaptureIntent } from '../../main/ts/application/use-cases/capture-intent.js';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';

class MockIntentRepository {
  saved: Intent[] = [];
  async getNextId() { return 'INTENT-001'; }
  async save(intent: Intent) { this.saved.push(intent); }
}

class MockGitRepository {
  branch = 'main';
  staged = ['cli/src/auth.ts'];
  modified = ['cli/src/index.ts'];
  root = '/home/user/project';

  async getCurrentBranch() { return this.branch; }
  async getStagedFiles() { return this.staged; }
  async getModifiedFiles() { return this.modified; }
  async getRepoRoot() { return this.root; }
}

class MockGitRepositoryThrows {
  async getCurrentBranch(): Promise<string> { throw new Error('no git'); }
  async getStagedFiles(): Promise<string[]> { throw new Error('no git'); }
  async getModifiedFiles(): Promise<string[]> { throw new Error('no git'); }
  async getRepoRoot(): Promise<string> { throw new Error('no git'); }
}

test('CaptureIntent creates an INTENT with CAPTURED status', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project/cli/src');
  const id = await useCase.execute('auth flow feels fragmented');
  assert.equal(id, 'INTENT-001');
  assert.equal(repo.saved.length, 1);
  assert.equal(repo.saved[0].status, IntentStatus.CAPTURED);
  assert.equal(repo.saved[0].rawIntent, 'auth flow feels fragmented');
});

test('CaptureIntent populates origin from git context', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project/cli/src');
  await useCase.execute('test intent');
  const intent = repo.saved[0];
  assert.equal(intent.origin.branch, 'main');
  assert.equal(intent.origin.source, 'cli');
  assert.equal(intent.origin.triggeredBy, 'capture');
});

test('CaptureIntent deduplicates recent_files between staged and modified', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  git.staged = ['shared.ts'];
  git.modified = ['shared.ts', 'other.ts'];
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project');
  await useCase.execute('test');
  const files = repo.saved[0].origin.recentFiles;
  assert.equal(files.filter(f => f === 'shared.ts').length, 1);
  assert.ok(files.includes('other.ts'));
});

test('CaptureIntent computes cwd relative to repo root', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  git.root = '/home/user/project';
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project/cli/src');
  await useCase.execute('test');
  assert.equal(repo.saved[0].origin.cwd, 'cli/src');
});

test('CaptureIntent handles git unavailable gracefully', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepositoryThrows();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/absolute/path');
  const id = await useCase.execute('test intent');
  assert.equal(id, 'INTENT-001');
  const intent = repo.saved[0];
  assert.equal(intent.origin.branch, undefined);
  assert.deepEqual(intent.origin.recentFiles, []);
  assert.equal(intent.origin.cwd, '/absolute/path');
});

test('CaptureIntent sets schema_version to 1', async () => {
  const repo = new MockIntentRepository();
  const git = new MockGitRepository();
  const useCase = new CaptureIntent(repo as any, git as any, () => '/home/user/project');
  await useCase.execute('test');
  assert.equal(repo.saved[0].schemaVersion, 1);
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd cli && npm test 2>&1 | grep -E "FAIL|Error" | head -5
```

Expected: error — module not found.

- [ ] **Step 3: Create CaptureIntent use case**

Create `cli/src/main/ts/application/use-cases/capture-intent.ts`:

```typescript
import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { Intent, IntentStatus } from '../../domain/models/intent.js';

export class CaptureIntent {
  constructor(
    private intentRepository: IntentRepository,
    private gitRepository: Pick<GitRepository, 'getCurrentBranch' | 'getStagedFiles' | 'getModifiedFiles' | 'getRepoRoot'>,
    private getCwd: () => string = () => process.cwd(),
  ) {}

  async execute(rawIntent: string): Promise<string> {
    const id = await this.intentRepository.getNextId();
    const now = new Date().toISOString();

    let branch: string | undefined;
    let recentFiles: string[] = [];
    let cwd: string;

    try {
      branch = await this.gitRepository.getCurrentBranch();
    } catch { /* git unavailable */ }

    try {
      const staged = await this.gitRepository.getStagedFiles();
      const modified = await this.gitRepository.getModifiedFiles();
      const seen = new Set<string>();
      for (const f of [...staged, ...modified]) {
        if (!seen.has(f)) {
          seen.add(f);
          recentFiles.push(f);
        }
      }
    } catch { /* git unavailable */ }

    const absoluteCwd = this.getCwd();
    try {
      const repoRoot = await this.gitRepository.getRepoRoot();
      cwd = absoluteCwd.startsWith(repoRoot)
        ? absoluteCwd.slice(repoRoot.length + 1) || '.'
        : absoluteCwd;
    } catch {
      cwd = absoluteCwd;
    }

    const intent: Intent = {
      id,
      schemaVersion: 1,
      status: IntentStatus.CAPTURED,
      createdAt: now,
      updatedAt: now,
      origin: {
        source: 'cli',
        branch,
        cwd,
        triggeredBy: 'capture',
        recentFiles,
      },
      interpretations: [],
      promotedTo: [],
      supersededBy: [],
      rawIntent: rawIntent.trim(),
    };

    await this.intentRepository.save(intent);
    return id;
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd cli && npm test 2>&1 | grep -E "✔|✗" | grep -i "capture"
```

Expected: all 6 CaptureIntent tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/use-cases/capture-intent.ts cli/src/test/ts/capture-intent.test.ts
git commit -m "feat: add CaptureIntent use case"
```

---

## Task 6: CaptureCommand + index.ts registration

**Files:**
- Create: `cli/src/main/ts/application/commands/capture-command.ts`
- Modify: `cli/src/main/ts/index.ts`

- [ ] **Step 1: Create CaptureCommand**

Create `cli/src/main/ts/application/commands/capture-command.ts`:

```typescript
import { CaptureIntent } from '../use-cases/capture-intent.js';

export class CaptureCommand {
  constructor(private captureIntent: CaptureIntent) {}

  async execute(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.error('arch capture requires an intent string');
      process.exit(1);
    }
    const rawIntent = args.join(' ');
    const id = await this.captureIntent.execute(rawIntent);
    console.log(`${id} captured.`);
  }
}
```

- [ ] **Step 2: Register in index.ts**

In `cli/src/main/ts/index.ts`, add imports at the top:

```typescript
import { MarkdownIntentRepository } from './infrastructure/filesystem/markdown-intent-repository.js';
import { CaptureIntent } from './application/use-cases/capture-intent.js';
import { CaptureCommand } from './application/commands/capture-command.js';
```

In the `switch (name)` block, add before `default:`:

```typescript
case 'capture': {
  const intentRepository = new MarkdownIntentRepository(fileSystem);
  const captureIntent = new CaptureIntent(intentRepository, gitRepository);
  await new CaptureCommand(captureIntent).execute(args);
  break;
}
```

Update the usage line in `default:`:

```typescript
console.log('Usage: arch [status|validate|review|task|inbox|next|version|govern|rank|batch|drain|conduct|promote|loop|sandbox|lint|mv|exec|merge-resolve|capture]');
```

- [ ] **Step 3: Build and smoke test**

```bash
cd cli && npm run build 2>&1 | tail -5
```

Expected: build succeeds with no errors.

```bash
cd /home/valentin/code/arch && node cli/dist/index.js capture "auth flow feels too fragmented"
```

Expected output:
```
INTENT-001 captured.
```

Verify the file was created:

```bash
cat docs/intents/INTENT-001.md
```

Expected: YAML frontmatter with `status: CAPTURED`, body with `auth flow feels too fragmented`.

- [ ] **Step 4: Run full test suite**

```bash
cd cli && npm test 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add cli/src/main/ts/application/commands/capture-command.ts cli/src/main/ts/index.ts
git commit -m "feat: add CaptureCommand and register arch capture"
```

---

## Task 7: THINK protocol update

**Files:**
- Modify: `docs/agents/THINK.md`

- [ ] **Step 1: Update THINK.md**

Replace the contents of `docs/agents/THINK.md` with:

```markdown
# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->

## Phase 1: Intent Operationalization (Signal Interpreter)
0. **Print:** `[THINK] Phase 1 — Intent Operationalization` to stdout.
1. Scan `docs/intents/` for all files with `status: CAPTURED`.
2. For each CAPTURED intent, assess: **can this signal be transformed into bounded operational work?**
3. Apply outcome:
   - **PROMOTED:** Create a TASK draft in `docs/tasks/` with the raw intent as context. Set `promoted_to: [TASK-XXX]` in the INTENT file. Set `status: PROMOTED`. Do **not** set the task status to READY — human confirms READY.
   - **SIGNAL:** Retained operational knowledge — friction, pattern, systemic observation. Append an interpretation entry, set `status: SIGNAL`. Record a note if it relates to an active concern.
   - **SUPERSEDED:** Intent absorbed by an existing TASK or INTENT. Set `superseded_by: [TASK-XXX|INTENT-XXX]`, set `status: SUPERSEDED`.
   - **DISCARDED:** No signal value. Set `status: DISCARDED` with a one-line note in the interpretation.
4. For every processed intent, append to its `interpretations` block:
   ```yaml
   - timestamp: <ISO-8601>
     actor: THINK
     classification: <bug|refactor|arch-concern|friction|research|signal-only>
     notes: "<reasoning>"
     confidence: <low|medium|high>
   ```
   `confidence` is a **hint only** — it never affects routing, promotion, or state.
5. **Phase boundary:** This phase does NOT perform governance, replenishment, or idea refinement. If a SIGNAL suggests a kaizen improvement, defer it to Phase 4.
6. **Evidence Required:** Each outcome decision must cite a concrete signal (e.g., "maps to ADR-002 concern", "covered by TASK-077").

## Phase 2: Context & Replenishment (Conductor)
0. **Print:** `[THINK] Phase 2 — Context & Replenishment` to stdout.
1. **Note:** `arch govern` was already executed by the CLI to trigger this session.
2. **Health Evaluation:** Identify P0 tasks that are blocked or not focused. If a task is `IN_PROGRESS` with a lock > 3 days, create a P1 `READY` bug task in `docs/tasks/`.
3. **INBOX Regeneration:** Overwrite `docs/INBOX.md` with current loop status, active/READY task counts, pending items (`AWAITING_PROMOTION`, `AWAITING_REVIEW`), and summaries of the last 5 completed tasks. **Refinement Queue:** Count all `IDEA-*.md` files in `docs/refinement/` (excluding `archive/` and `TEMPLATE.md`) and list each title; write "No pending ideas." only when the count is zero. Commit with `[THINK]` tag.
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 has stale lock').

## Phase 3: Idea Refinement (Refine)
0. **Print:** `[THINK] Phase 3 — Idea Refinement` to stdout.
1. Scan `docs/refinement/` for `IDEA-*.md` files. Triage: process all IDEAs with a `Decision:` field first; for DRAFT IDEAs, process at most 3 per session.
2. For each IDEA, apply lifecycle rules:
   - **DRAFT:** Identify gaps, dependencies, and estimate. Output to terminal only. Increment `**Sessions:** N` counter in the IDEA file (add field if missing). If `Sessions >= 3`, emit `[STALE-IDEA] IDEA-slug — N sessions without Decision` to stdout. If the IDEA was already flagged `[STALE-IDEA]` in the previous session (Sessions > 3) and still has no Decision, move it to `docs/refinement/archive/` with status `REJECTED: TTL expired`.
   - **DECIDED:** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA.
   - **REJECTED:** Move to `docs/refinement/archive/`.
3. **Phase boundary:** This phase does NOT interpret INTENT signals or create tasks from intents.

## Phase 4: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 4 — Continuous Kaizen` to stdout.
1. **Kaizen Learning:** Run `arch review --json`. If failures exist (and aren't in `docs/KAIZEN-LOG.md` exceptions), analyze violations/drift against `docs/PRINCIPLES.md` (primary context) and `docs/KAIZEN-LOG.md` (audit trail). If a violation matches an existing principle, reference it. If it represents a new pattern, propose a new principle entry and a hardening task (`fix:` or `feat:`) to prevent recurrence.
2. **Mura Detection:** Read `Turns: N` from the last 10 archived tasks. For each size tier (XS/S/M/L), compute the average. If actual avg exceeds the expected range in `docs/METRICS.md` by >50%, emit `[MURA] <size>-tier avg=N turns (threshold=T)` to stdout and propose a re-estimation or decomposition task.
3. **Immediate Improvements:** Identify context gaps or guideline changes based on patterns. SIGNALed intents from Phase 1 may surface relevant friction here.
4. **Sprint Metrics:** On sprint close, generate `docs/METRICS.md` summary using the Sprint Template block.
5. **Periodic Architecture Revision (bi-weekly):** Read the `Last-Revision:` field at the bottom of `docs/KAIZEN-LOG.md`. If the field is absent or its date is more than 14 days before today, run a focused architecture audit; otherwise skip this step. Use `docs/METRICS.md` cost-per-task and turns-per-task data as the primary signal for identifying friction candidates (skip if fewer than 5 tasks are recorded). Produce a numbered list of concrete streamlining proposals — each must be an actionable proposal, not an observation — formatted as:
   ```
   [REVISION] <N>. <proposal> → <next action: IDEA draft docs/refinement/IDEA-<slug>.md | direct fix in <file>>
   ```
   Output to terminal only. If a proposal warrants a task, create an IDEA draft in `docs/refinement/IDEA-<slug>.md` and commit with `idea:` prefix. After completing the audit, append `Last-Revision: YYYY-MM-DD` (today's date) to `docs/KAIZEN-LOG.md` and commit with `[THINK]` tag.

## Output
- Ephemeral read-only output to terminal.
- Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
- Revision: `[REVISION] <N>. <proposal> → <next action>`
- **Finally, print:** `[THINK] Done` to stdout.
```

- [ ] **Step 2: Verify THINK.md renders correctly**

```bash
grep -n "Phase" docs/agents/THINK.md
```

Expected output:
```
4:## Phase 1: Intent Operationalization (Signal Interpreter)
27:## Phase 2: Context & Replenishment (Conductor)
35:## Phase 3: Idea Refinement (Refine)
45:## Phase 4: Continuous Kaizen (Real-time Reviewer)
```

- [ ] **Step 3: Run arch review to confirm no system violations**

```bash
arch review 2>&1 | tail -20
```

Expected: no new violations introduced by the changes.

- [ ] **Step 4: Commit**

```bash
git add docs/agents/THINK.md
git commit -m "feat: [THINK] add Phase 1 Intent Operationalization to THINK protocol"
```

---

## Final verification

- [ ] **Smoke test the full pipeline**

```bash
cd /home/valentin/code/arch
node cli/dist/index.js capture "the sandbox execution model feels underdefined"
node cli/dist/index.js capture "maybe we should support parallel intent capture"
ls docs/intents/
cat docs/intents/INTENT-001.md
```

Expected: two INTENT files with correct frontmatter and bodies.

- [ ] **Run full test suite one final time**

```bash
cd cli && npm test 2>&1 | tail -20
```

Expected: all tests pass.
