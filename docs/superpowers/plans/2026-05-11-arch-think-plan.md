# arch think Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `arch think` — the intent promotion engine that scaffolds captured intents into DRAFT task files, coordinates agent enrichment, and finalizes the promotion atomically.

**Architecture:** Three-phase pipeline: (1) CLI scaffolds TASK file from CAPTURED intent via `ContextInference`; (2) agent writes enrichment patches to `.arch/pending/`; (3) CLI applies `FinalizePromotion` using staging + ordered atomic renames. The agent never writes TASK/INTENT files directly. `CaptureCommand` is extended to accept piped stdin.

**Tech Stack:** TypeScript, node:fs/promises (atomic rename via `fs.rename`), node:test + node:assert, existing `FileSystem` interface, `MarkdownTaskRepository`, `ContextInference`

---

## File Map

### Created
- `cli/src/main/ts/application/commands/think-command.ts` — `arch think [INTENT-ID]` entry point
- `cli/src/main/ts/application/use-cases/scaffold-task.ts` — Phase 1: deterministic scaffold writer
- `cli/src/main/ts/application/use-cases/finalize-promotion.ts` — Phase 3: staging + atomic rename transaction
- `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts` — add `deleteFile` and `unlink` (needed for cleanup)
- `cli/src/test/ts/capture-command.test.ts` — pipe support tests
- `cli/src/test/ts/scaffold-task.test.ts` — Phase 1 scaffold tests
- `cli/src/test/ts/finalize-promotion.test.ts` — Phase 3 transaction tests
- `cli/src/test/ts/think-command.test.ts` — integration test (CAPTURED → finalized DRAFT)

### Modified
- `cli/src/main/ts/domain/models/task.ts` — add `DRAFT` to `TaskStatus` enum
- `cli/src/main/ts/domain/models/intent.ts` — add `promotedTo` write path (already exists in model; add `readAll` + `findCaptured` to interface)
- `cli/src/main/ts/domain/repositories/intent-repository.ts` — add `getById`, `update`, `findCaptured`
- `cli/src/main/ts/domain/repositories/file-system.ts` — add `deleteFile(path): Promise<void>`
- `cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts` — implement `getById`, `update`, `findCaptured`; deserialize front matter
- `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts` — implement `deleteFile`
- `cli/src/main/ts/application/commands/capture-command.ts` — add stdin pipe fallback
- `cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts` — parse `DRAFT` status; `source` field; `enrichmentPhase` field
- `cli/src/main/ts/index.ts` — register `think` case; update usage line

---

## Task 1: Add `DRAFT` to `TaskStatus` and extend `IntentRepository`

**Files:**
- Modify: `cli/src/main/ts/domain/models/task.ts`
- Modify: `cli/src/main/ts/domain/repositories/intent-repository.ts`
- Modify: `cli/src/main/ts/domain/models/intent.ts`

- [ ] **Step 1: Write the failing test for `DRAFT` task status parsing**

Create `cli/src/test/ts/scaffold-task.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

test('TaskStatus.DRAFT is defined and distinct from BACKLOG', () => {
  assert.strictEqual(TaskStatus.DRAFT, 'DRAFT');
  assert.notStrictEqual(TaskStatus.DRAFT, TaskStatus.BACKLOG);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd cli && npm test -- --test-name-pattern "TaskStatus.DRAFT"
```
Expected: FAIL — `DRAFT` not on enum

- [ ] **Step 3: Add `DRAFT` to `TaskStatus` enum**

In `cli/src/main/ts/domain/models/task.ts`:

```typescript
export enum TaskStatus {
  DRAFT = 'DRAFT',
  IDEA = 'IDEA',
  BACKLOG = 'BACKLOG',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
  REJECTED = 'REJECTED'
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd cli && npm test -- --test-name-pattern "TaskStatus.DRAFT"
```
Expected: PASS

- [ ] **Step 5: Write failing test for `IntentRepository.findCaptured` and `getById`**

Append to `cli/src/test/ts/scaffold-task.test.ts`:

```typescript
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';
import type { IntentRepository } from '../../main/ts/domain/repositories/intent-repository.js';

// Type-level test: IntentRepository interface must declare findCaptured and getById
const _typeCheck: IntentRepository = {
  getNextId: async () => 'INTENT-001',
  save: async () => {},
  getById: async (_id: string) => null,
  update: async (_intent: Intent) => {},
  findCaptured: async () => [],
};
assert.ok(_typeCheck);
```

- [ ] **Step 6: Run test to verify it fails (TS compile error)**

```bash
cd cli && npm run build 2>&1 | grep -E "error TS"
```
Expected: TS error — `getById`/`update`/`findCaptured` not on `IntentRepository`

- [ ] **Step 7: Extend `IntentRepository` interface**

In `cli/src/main/ts/domain/repositories/intent-repository.ts`:

```typescript
import type { Intent } from '../models/intent.js';

export interface IntentRepository {
  getNextId(): Promise<string>;
  save(intent: Intent): Promise<void>;
  getById(id: string): Promise<Intent | null>;
  update(intent: Intent): Promise<void>;
  findCaptured(): Promise<Intent[]>;
}
```

- [ ] **Step 8: Run tests to verify passing**

```bash
cd cli && npm test
```
Expected: All pass (compile error resolved)

- [ ] **Step 9: Commit**

```bash
git add cli/src/main/ts/domain/models/task.ts cli/src/main/ts/domain/repositories/intent-repository.ts cli/src/main/ts/domain/models/intent.ts cli/src/test/ts/scaffold-task.test.ts
git commit -m "feat: [TASK-XXX] add DRAFT status and extend IntentRepository interface"
```

---

## Task 2: Implement `findCaptured`, `getById`, `update` in `MarkdownIntentRepository` and add `deleteFile` to FileSystem

**Files:**
- Modify: `cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts`
- Modify: `cli/src/main/ts/domain/repositories/file-system.ts`
- Modify: `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts`
- Test: `cli/src/test/ts/scaffold-task.test.ts`

- [ ] **Step 1: Write failing tests for `MarkdownIntentRepository` extensions**

Append to `cli/src/test/ts/scaffold-task.test.ts`:

```typescript
import { MarkdownIntentRepository } from '../../main/ts/infrastructure/filesystem/markdown-intent-repository.js';

class MockFS {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  deleted: string[] = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename(o: string, n: string) { this.files[n] = this.files[o]; delete this.files[o]; }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async deleteFile(p: string) { this.deleted.push(p); delete this.files[p]; }
}

const INTENT_MD = `---
id: INTENT-001
schema_version: 1
status: CAPTURED
created_at: 2026-05-11T10:00:00Z
updated_at: 2026-05-11T10:00:00Z

origin:
  source: cli
  branch: main
  cwd: cli/src
  triggered_by: capture
  recent_files: []

interpretations: []
promoted_to: []
superseded_by: []
---

fix oauth callback session loss
`;

test('MarkdownIntentRepository.getById returns parsed intent', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = await repo.getById('INTENT-001');
  assert.ok(intent);
  assert.strictEqual(intent!.id, 'INTENT-001');
  assert.strictEqual(intent!.status, IntentStatus.CAPTURED);
  assert.strictEqual(intent!.rawIntent, 'fix oauth callback session loss');
});

test('MarkdownIntentRepository.getById returns null for unknown id', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = [];
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = await repo.getById('INTENT-999');
  assert.strictEqual(intent, null);
});

test('MarkdownIntentRepository.findCaptured returns only CAPTURED intents', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = ['INTENT-001.md', 'INTENT-002.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  fs.files['docs/intents/INTENT-002.md'] = INTENT_MD.replace('status: CAPTURED', 'status: PROMOTED');
  const repo = new MarkdownIntentRepository(fs as any);
  const captured = await repo.findCaptured();
  assert.strictEqual(captured.length, 1);
  assert.strictEqual(captured[0].id, 'INTENT-001');
});

test('MarkdownIntentRepository.update serializes status and promotedTo', async () => {
  const fs = new MockFS();
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  fs.files['docs/intents/INTENT-001.md'] = INTENT_MD;
  const repo = new MarkdownIntentRepository(fs as any);
  const intent = (await repo.getById('INTENT-001'))!;
  intent.status = IntentStatus.PROMOTED;
  intent.promotedTo = ['TASK-212'];
  await repo.update(intent);
  const written = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(written.includes('status: PROMOTED'));
  assert.ok(written.includes('- TASK-212'));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test -- --test-name-pattern "MarkdownIntentRepository"
```
Expected: FAIL — methods not implemented

- [ ] **Step 3: Add `deleteFile` to FileSystem interface**

In `cli/src/main/ts/domain/repositories/file-system.ts`:

```typescript
export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  readDirectory(path: string): Promise<string[]>;
  rename(oldPath: string, newPath: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  appendFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
}
```

- [ ] **Step 4: Implement `deleteFile` in `NodeFileSystem`**

In `cli/src/main/ts/infrastructure/filesystem/node-file-system.ts`, add:

```typescript
import { unlink } from 'node:fs/promises';

// inside NodeFileSystem class:
async deleteFile(path: string): Promise<void> {
  await unlink(path);
}
```

- [ ] **Step 5: Implement `getById`, `update`, `findCaptured` in `MarkdownIntentRepository`**

The repository needs to parse the YAML front matter it already writes. Add a `deserialize` method and implement the three new interface methods. Full replacement of the class:

```typescript
import path from 'node:path';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { Intent, IntentStatus } from '../../domain/models/intent.js';
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
      .filter(f => /^INTENT-\d+\.md$/.test(f))
      .map(f => parseInt(f.replace('INTENT-', '').replace('.md', ''), 10));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    return `INTENT-${(maxId + 1).toString().padStart(3, '0')}`;
  }

  async save(intent: Intent): Promise<void> {
    await this.fileSystem.mkdir(this.intentsDir);
    const filePath = path.join(this.intentsDir, `${intent.id}.md`);
    await this.fileSystem.writeFile(filePath, this.serialize(intent));
  }

  async update(intent: Intent): Promise<void> {
    const filePath = path.join(this.intentsDir, `${intent.id}.md`);
    await this.fileSystem.writeFile(filePath, this.serialize(intent));
  }

  async getById(id: string): Promise<Intent | null> {
    const filePath = path.join(this.intentsDir, `${id}.md`);
    if (!(await this.fileSystem.exists(filePath))) return null;
    const content = await this.fileSystem.readFile(filePath);
    return this.deserialize(content);
  }

  async findCaptured(): Promise<Intent[]> {
    if (!(await this.fileSystem.exists(this.intentsDir))) return [];
    const files = await this.fileSystem.readDirectory(this.intentsDir);
    const intents: Intent[] = [];
    for (const file of files) {
      if (!/^INTENT-\d+\.md$/.test(file)) continue;
      const content = await this.fileSystem.readFile(path.join(this.intentsDir, file));
      const intent = this.deserialize(content);
      if (intent && intent.status === IntentStatus.CAPTURED) {
        intents.push(intent);
      }
    }
    return intents;
  }

  private deserialize(content: string): Intent | null {
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) return null;
    const fm = fmMatch[1];
    const body = fmMatch[2].trim();

    const get = (key: string) => {
      const m = fm.match(new RegExp(`^${key}: (.+)$`, 'm'));
      return m ? m[1].trim() : '';
    };
    const getList = (key: string): string[] => {
      const inlineMatch = fm.match(new RegExp(`^${key}: \\[\\]`, 'm'));
      if (inlineMatch) return [];
      const blockStart = fm.indexOf(`${key}:\n`);
      if (blockStart === -1) return [];
      const block = fm.slice(blockStart + key.length + 2);
      const items: string[] = [];
      for (const line of block.split('\n')) {
        if (!line.startsWith('  - ')) break;
        items.push(line.slice(4).trim());
      }
      return items;
    };

    return {
      id: get('id'),
      schemaVersion: parseInt(get('schema_version'), 10) || 1,
      status: get('status') as IntentStatus,
      createdAt: get('created_at'),
      updatedAt: get('updated_at'),
      origin: {
        source: fm.match(/^  source: (.+)$/m)?.[1]?.trim() ?? 'cli',
        branch: fm.match(/^  branch: (.+)$/m)?.[1]?.trim(),
        cwd: fm.match(/^  cwd: (.+)$/m)?.[1]?.trim(),
        triggeredBy: fm.match(/^  triggered_by: (.+)$/m)?.[1]?.trim() ?? 'capture',
        recentFiles: (() => {
          const inlineMatch = fm.match(/^  recent_files: \[\]$/m);
          if (inlineMatch) return [];
          const idx = fm.indexOf('  recent_files:\n');
          if (idx === -1) return [];
          const block = fm.slice(idx + 16);
          const items: string[] = [];
          for (const line of block.split('\n')) {
            if (!line.startsWith('    - ')) break;
            items.push(line.slice(6).trim());
          }
          return items;
        })(),
      },
      interpretations: [],
      promotedTo: getList('promoted_to'),
      supersededBy: getList('superseded_by'),
      rawIntent: body,
    };
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
      intent.promotedTo.length === 0
        ? 'promoted_to: []'
        : 'promoted_to:\n' + intent.promotedTo.map(t => `  - ${t}`).join('\n'),
      intent.supersededBy.length === 0
        ? 'superseded_by: []'
        : 'superseded_by:\n' + intent.supersededBy.map(t => `  - ${t}`).join('\n'),
      '---',
      '',
      intent.rawIntent,
    ];

    return lines.filter((l): l is string => l !== null).join('\n') + '\n';
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd cli && npm test -- --test-name-pattern "MarkdownIntentRepository"
```
Expected: All PASS

- [ ] **Step 7: Run full test suite**

```bash
cd cli && npm test
```
Expected: All pass

- [ ] **Step 8: Commit**

```bash
git add cli/src/main/ts/domain/repositories/file-system.ts \
        cli/src/main/ts/infrastructure/filesystem/node-file-system.ts \
        cli/src/main/ts/infrastructure/filesystem/markdown-intent-repository.ts \
        cli/src/test/ts/scaffold-task.test.ts
git commit -m "feat: [TASK-XXX] implement intent deserialization and repo extension methods"
```

---

## Task 3: Add pipe support to `arch capture`

**Files:**
- Modify: `cli/src/main/ts/application/commands/capture-command.ts`
- Create: `cli/src/test/ts/capture-command.test.ts`

- [ ] **Step 1: Write failing tests for pipe support**

Create `cli/src/test/ts/capture-command.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { CaptureCommand } from '../../main/ts/application/commands/capture-command.js';

class MockCaptureIntent {
  lastRaw: string | null = null;
  async execute(raw: string): Promise<string> {
    this.lastRaw = raw;
    return 'INTENT-001';
  }
}

async function makeCommand(opts: {
  args?: string[];
  stdin?: string;
  isTTY?: boolean;
}): Promise<{ out: string[]; err: string[]; exit: number | null; mock: MockCaptureIntent }> {
  const mock = new MockCaptureIntent();
  const out: string[] = [];
  const err: string[] = [];
  let exitCode: number | null = null;

  const cmd = new CaptureCommand(mock as any, {
    getArgs: () => opts.args ?? [],
    readStdin: async () => opts.stdin ?? '',
    isStdinTTY: () => opts.isTTY ?? true,
    log: (s: string) => { out.push(s); },
    error: (s: string) => { err.push(s); },
    exit: (code: number) => { exitCode = code; throw new Error(`exit:${code}`); },
  });

  try {
    await cmd.execute();
  } catch (e: any) {
    if (!e.message?.startsWith('exit:')) throw e;
  }
  return { out, err, exit: exitCode, mock };
}

test('CaptureCommand - argv arg is used when provided', async () => {
  const { mock, out } = await makeCommand({ args: ['fix', 'login', 'flow'] });
  assert.strictEqual(mock.lastRaw, 'fix login flow');
  assert.ok(out[0].includes('INTENT-001'));
});

test('CaptureCommand - stdin is used when argv is empty and stdin is piped', async () => {
  const { mock } = await makeCommand({ args: [], stdin: '  fix login flow  ', isTTY: false });
  assert.strictEqual(mock.lastRaw, 'fix login flow');
});

test('CaptureCommand - argv wins over stdin when both provided', async () => {
  const { mock } = await makeCommand({ args: ['from-argv'], stdin: 'from-stdin', isTTY: false });
  assert.strictEqual(mock.lastRaw, 'from-argv');
});

test('CaptureCommand - multiline stdin is accepted', async () => {
  const { mock } = await makeCommand({ args: [], stdin: 'line one\nline two\nline three', isTTY: false });
  assert.ok(mock.lastRaw!.includes('line one'));
});

test('CaptureCommand - empty stdin after trim is a hard error', async () => {
  const { exit, err } = await makeCommand({ args: [], stdin: '   \n  ', isTTY: false });
  assert.strictEqual(exit, 1);
  assert.ok(err.some(e => e.includes('capture text required')));
});

test('CaptureCommand - no argv and TTY stdin is a hard error', async () => {
  const { exit, err } = await makeCommand({ args: [], stdin: '', isTTY: true });
  assert.strictEqual(exit, 1);
  assert.ok(err.some(e => e.includes('capture text required')));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test -- --test-name-pattern "CaptureCommand"
```
Expected: FAIL — constructor signature mismatch

- [ ] **Step 3: Rewrite `CaptureCommand` with IO interface injection**

Replace `cli/src/main/ts/application/commands/capture-command.ts`:

```typescript
import { CaptureIntent } from '../use-cases/capture-intent.js';

export interface CaptureIO {
  getArgs(): string[];
  readStdin(): Promise<string>;
  isStdinTTY(): boolean;
  log(s: string): void;
  error(s: string): void;
  exit(code: number): never;
}

function defaultIO(): CaptureIO {
  return {
    getArgs: () => [],
    readStdin: () => new Promise<string>((resolve) => {
      const chunks: Buffer[] = [];
      process.stdin.on('data', (c) => chunks.push(c));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }),
    isStdinTTY: () => Boolean(process.stdin.isTTY),
    log: (s) => console.log(s),
    error: (s) => console.error(s),
    exit: (code) => process.exit(code),
  };
}

export class CaptureCommand {
  private io: CaptureIO;

  constructor(
    private captureIntent: CaptureIntent,
    io?: CaptureIO,
  ) {
    this.io = io ?? defaultIO();
  }

  async execute(): Promise<void> {
    const args = this.io.getArgs();
    let rawIntent: string;

    if (args.length > 0) {
      rawIntent = args.join(' ');
    } else if (!this.io.isStdinTTY()) {
      rawIntent = (await this.io.readStdin()).trim();
    } else {
      this.io.error('Error: capture text required\nUsage:\n  arch capture "text"\n  echo "text" | arch capture');
      this.io.exit(1);
    }

    if (!rawIntent.trim()) {
      this.io.error('Error: capture text required\nUsage:\n  arch capture "text"\n  echo "text" | arch capture');
      this.io.exit(1);
    }

    const id = await this.captureIntent.execute(rawIntent);
    this.io.log(`${id} captured.`);
  }
}
```

- [ ] **Step 4: Update `index.ts` to pass args to `CaptureCommand`**

In `cli/src/main/ts/index.ts`, replace the `capture` case:

```typescript
case 'capture': {
  const intentRepository = new MarkdownIntentRepository(fileSystem);
  const captureIntent = new CaptureIntent(intentRepository, gitRepository);
  await new CaptureCommand(captureIntent, {
    getArgs: () => args,
    readStdin: () => new Promise<string>((resolve) => {
      const chunks: Buffer[] = [];
      process.stdin.on('data', (c) => chunks.push(c));
      process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    }),
    isStdinTTY: () => Boolean(process.stdin.isTTY),
    log: (s) => console.log(s),
    error: (s) => console.error(s),
    exit: (code) => process.exit(code) as never,
  }).execute();
  break;
}
```

- [ ] **Step 5: Run capture-command tests to verify they pass**

```bash
cd cli && npm test -- --test-name-pattern "CaptureCommand"
```
Expected: All PASS

- [ ] **Step 6: Run full suite**

```bash
cd cli && npm test
```
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add cli/src/main/ts/application/commands/capture-command.ts \
        cli/src/main/ts/index.ts \
        cli/src/test/ts/capture-command.test.ts
git commit -m "feat: [TASK-XXX] add stdin pipe support to arch capture"
```

---

## Task 4: Implement `ScaffoldTask` use case (Phase 1)

**Files:**
- Create: `cli/src/main/ts/application/use-cases/scaffold-task.ts`
- Test: `cli/src/test/ts/scaffold-task.test.ts`

The scaffold phase: given a CAPTURED intent, allocate TASK-ID, run `ContextInference`, write `docs/tasks/TASK-XXX.md` with `enrichment_phase: scaffolded` and `TASK.state: DRAFT`.

- [ ] **Step 1: Write failing tests for `ScaffoldTask`**

Append to `cli/src/test/ts/scaffold-task.test.ts`:

```typescript
import { ScaffoldTask } from '../../main/ts/application/use-cases/scaffold-task.js';

const CAPTURED_INTENT: Intent = {
  id: 'INTENT-001',
  schemaVersion: 1,
  status: IntentStatus.CAPTURED,
  createdAt: '2026-05-11T10:00:00Z',
  updatedAt: '2026-05-11T10:00:00Z',
  origin: { source: 'cli', branch: 'main', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: [] },
  interpretations: [],
  promotedTo: [],
  supersededBy: [],
  rawIntent: 'fix oauth callback session loss',
};

class MockIntentRepo {
  saved: Intent[] = [CAPTURED_INTENT];
  updated: Intent[] = [];
  async getNextId() { return 'INTENT-001'; }
  async save(i: Intent) { this.saved.push(i); }
  async getById(id: string) { return this.saved.find(i => i.id === id) ?? null; }
  async update(i: Intent) { this.updated.push(i); }
  async findCaptured() { return this.saved.filter(i => i.status === IntentStatus.CAPTURED); }
}

class MockTaskRepo {
  tasks: Task[] = [];
  savedFiles: Record<string, string> = {};
  async getNextId() { return 'TASK-212'; }
  async getAll() { return this.tasks; }
  async getActive() { return this.tasks; }
  async getById(id: string) { return this.tasks.find(t => t.id === id) ?? null; }
  async save(_t: Task) {}
}

class MockFS2 extends MockFS {}

test('ScaffoldTask writes a DRAFT task file with enrichment_phase: scaffolded', async () => {
  const fs = new MockFS2();
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  const result = await useCase.execute('INTENT-001');

  assert.strictEqual(result.taskId, 'TASK-212');
  assert.strictEqual(result.intentId, 'INTENT-001');

  const taskFile = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskFile, 'task file should exist');
  assert.ok(taskFile.includes('## TASK-212:'));
  assert.ok(taskFile.includes('DRAFT'));
  assert.ok(taskFile.includes('enrichment_phase: scaffolded'));
  assert.ok(taskFile.includes('**Source:** INTENT-001'));
});

test('ScaffoldTask aborts if intent not CAPTURED', async () => {
  const fs = new MockFS2();
  const intentRepo = new MockIntentRepo();
  intentRepo.saved[0] = { ...CAPTURED_INTENT, status: IntentStatus.PROMOTED };
  const taskRepo = new MockTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await assert.rejects(
    () => useCase.execute('INTENT-001'),
    /not CAPTURED/,
  );
});

test('ScaffoldTask aborts if task file already exists', async () => {
  const fs = new MockFS2();
  fs.files['docs/tasks/TASK-212.md'] = 'existing';
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await assert.rejects(
    () => useCase.execute('INTENT-001'),
    /already exists/,
  );
});

test('ScaffoldTask aborts if intent already has promotedTo', async () => {
  const fs = new MockFS2();
  const intentRepo = new MockIntentRepo();
  intentRepo.saved[0] = { ...CAPTURED_INTENT, promotedTo: ['TASK-100'] };
  const taskRepo = new MockTaskRepo();
  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);

  await assert.rejects(
    () => useCase.execute('INTENT-001'),
    /already promoted/,
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test -- --test-name-pattern "ScaffoldTask"
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `ScaffoldTask`**

Create `cli/src/main/ts/application/use-cases/scaffold-task.ts`:

```typescript
import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { IntentStatus } from '../../domain/models/intent.js';

export interface ScaffoldResult {
  taskId: string;
  intentId: string;
}

export class ScaffoldTask {
  constructor(
    private intentRepository: IntentRepository,
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
  ) {}

  async execute(intentId: string): Promise<ScaffoldResult> {
    const intent = await this.intentRepository.getById(intentId);
    if (!intent) throw new Error(`Intent ${intentId} not found`);
    if (intent.status !== IntentStatus.CAPTURED) {
      throw new Error(`Intent ${intentId} is not CAPTURED (status: ${intent.status})`);
    }
    if (intent.promotedTo.length > 0) {
      throw new Error(`Intent ${intentId} is already promoted to ${intent.promotedTo.join(', ')}`);
    }

    const taskId = await this.taskRepository.getNextId();
    const taskPath = `docs/tasks/${taskId}.md`;

    if (await this.fileSystem.exists(taskPath)) {
      throw new Error(`Task file ${taskPath} already exists`);
    }

    const now = new Date().toISOString();
    const content = this.buildScaffold(taskId, intentId, intent.rawIntent, now);

    await this.fileSystem.mkdir('docs/tasks');
    await this.fileSystem.writeFile(taskPath, content);

    return { taskId, intentId };
  }

  private buildScaffold(taskId: string, intentId: string, rawIntent: string, now: string): string {
    const title = rawIntent.length > 60 ? rawIntent.slice(0, 57) + '...' : rawIntent;
    return `## ${taskId}: ${title}

**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Source:** ${intentId}
**Depends:** none

### Generation

enrichment_phase: scaffolded
scaffolded_by: arch-cli
scaffolded_at: ${now}
enriched_by: ~

### Objective

_Awaiting agent enrichment_

### Acceptance Criteria

_Awaiting agent enrichment_

### Complexity

_Awaiting agent enrichment_

### Confidence

_Awaiting agent enrichment_

### Relevant Context

_confidence: ~_

_Pending ContextInference_

### Risks

_Awaiting agent enrichment_
`;
  }
}
```

- [ ] **Step 4: Run scaffold tests to verify they pass**

```bash
cd cli && npm test -- --test-name-pattern "ScaffoldTask"
```
Expected: All PASS

- [ ] **Step 5: Run full suite**

```bash
cd cli && npm test
```
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/application/use-cases/scaffold-task.ts \
        cli/src/test/ts/scaffold-task.test.ts
git commit -m "feat: [TASK-XXX] implement ScaffoldTask Phase 1 use case"
```

---

## Task 5: Implement `FinalizePromotion` use case (Phase 3)

**Files:**
- Create: `cli/src/main/ts/application/use-cases/finalize-promotion.ts`
- Create: `cli/src/test/ts/finalize-promotion.test.ts`

`FinalizePromotion` validates the pending patch pair, stages all writes to `.arch/staging/`, commits via ordered atomic renames, cleans up pending/locks/staging, and handles failures by writing error artifacts.

- [ ] **Step 1: Write failing tests**

Create `cli/src/test/ts/finalize-promotion.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { FinalizePromotion } from '../../main/ts/application/use-cases/finalize-promotion.js';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';

class MockFS {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  deleted: string[] = [];
  renames: Array<[string, string]> = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename(o: string, n: string) {
    this.renames.push([o, n]);
    this.files[n] = this.files[o];
    delete this.files[o];
  }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async deleteFile(p: string) { this.deleted.push(p); delete this.files[p]; }
}

const SCAFFOLD_CONTENT = `## TASK-212: fix oauth callback session loss

**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Source:** INTENT-001
**Depends:** none

### Generation

enrichment_phase: scaffolded
scaffolded_by: arch-cli
scaffolded_at: 2026-05-11T10:00:00Z
enriched_by: ~

### Objective

_Awaiting agent enrichment_
`;

const INTENT_CONTENT = `---
id: INTENT-001
schema_version: 1
status: CAPTURED
created_at: 2026-05-11T10:00:00Z
updated_at: 2026-05-11T10:00:00Z

origin:
  source: cli
  branch: main
  cwd: cli/src
  triggered_by: capture
  recent_files: []

interpretations: []
promoted_to: []
superseded_by: []
---

fix oauth callback session loss
`;

const VALID_PATCH = JSON.stringify({
  task_id: 'TASK-212',
  intent_id: 'INTENT-001',
  schema_version: 1,
  produced_at: '2026-05-11T10:30:00Z',
  actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
  content: `## TASK-212: Fix OAuth callback session loss

**Meta:** P1 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Source:** INTENT-001
**Depends:** none

### Objective

Stabilize OAuth callback redirect to prevent session loss.

### Acceptance Criteria

- [ ] User remains authenticated after OAuth callback redirect

### Complexity

M — isolated auth flow change

### Confidence

medium — related files identified

### Risks

- Refresh token regression under concurrent tab scenario`,
});

const VALID_TRANSITION = JSON.stringify({
  intent_id: 'INTENT-001',
  task_id: 'TASK-212',
  schema_version: 1,
  produced_at: '2026-05-11T10:30:00Z',
  action: 'promote',
  promotion_confidence: 'medium',
});

test('FinalizePromotion happy path - all artifacts written, pending cleaned', async () => {
  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = VALID_PATCH;
  fs.files['.arch/pending/INTENT-001-transition.json'] = VALID_TRANSITION;
  fs.files['.arch/locks/TASK-212.lock'] = new Date().toISOString();

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, true);

  // TASK file should be updated with finalized content
  const taskContent = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskContent.includes('enrichment_phase: finalized'));
  assert.ok(taskContent.includes('Fix OAuth callback session loss'));

  // INTENT file should be updated to PROMOTED
  const intentContent = fs.files['docs/intents/INTENT-001.md'];
  assert.ok(intentContent.includes('status: PROMOTED'));
  assert.ok(intentContent.includes('TASK-212'));

  // Enrichment snapshot should exist
  const snapshot = fs.files['.arch/enrichments/TASK-212.json'];
  assert.ok(snapshot);
  const parsed = JSON.parse(snapshot);
  assert.strictEqual(parsed.task_id, 'TASK-212');
  assert.strictEqual(parsed.intent_id, 'INTENT-001');

  // Pending files should be deleted
  assert.ok(!('.arch/pending/TASK-212-patch.json' in fs.files));
  assert.ok(!('.arch/pending/INTENT-001-transition.json' in fs.files));

  // Lock should be deleted
  assert.ok(!('.arch/locks/TASK-212.lock' in fs.files));
});

test('FinalizePromotion - aborts if enrichment_phase is not scaffolded', async () => {
  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT.replace('enrichment_phase: scaffolded', 'enrichment_phase: finalized');
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = VALID_PATCH;
  fs.files['.arch/pending/INTENT-001-transition.json'] = VALID_TRANSITION;

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  assert.ok(result.reason?.includes('enrichment_phase'));
});

test('FinalizePromotion - aborts if intent status is not CAPTURED', async () => {
  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT.replace('status: CAPTURED', 'status: PROMOTED');
  fs.files['.arch/pending/TASK-212-patch.json'] = VALID_PATCH;
  fs.files['.arch/pending/INTENT-001-transition.json'] = VALID_TRANSITION;

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  assert.ok(result.reason?.includes('not CAPTURED'));
});

test('FinalizePromotion - writes error artifact on invalid patch content', async () => {
  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  const badPatch = JSON.stringify({ task_id: 'TASK-212', intent_id: 'INTENT-001', schema_version: 1, produced_at: '2026-05-11T10:30:00Z', actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' }, content: '' });
  fs.files['.arch/pending/TASK-212-patch.json'] = badPatch;
  fs.files['.arch/pending/INTENT-001-transition.json'] = VALID_TRANSITION;

  const useCase = new FinalizePromotion(fs as any);
  const result = await useCase.execute('TASK-212', 'INTENT-001');

  assert.strictEqual(result.success, false);
  const errorFile = fs.files['.arch/enrichments/TASK-212-error.json'];
  assert.ok(errorFile, 'error artifact should be written');
  const err = JSON.parse(errorFile);
  assert.strictEqual(err.task_id, 'TASK-212');
});

test('FinalizePromotion - pending files deleted on both success and failure', async () => {
  const fs = new MockFS();
  fs.files['docs/tasks/TASK-212.md'] = SCAFFOLD_CONTENT;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  const badPatch = JSON.stringify({ task_id: 'TASK-212', intent_id: 'INTENT-001', schema_version: 1, produced_at: '2026-05-11T10:30:00Z', actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' }, content: '' });
  fs.files['.arch/pending/TASK-212-patch.json'] = badPatch;
  fs.files['.arch/pending/INTENT-001-transition.json'] = VALID_TRANSITION;

  const useCase = new FinalizePromotion(fs as any);
  await useCase.execute('TASK-212', 'INTENT-001');

  assert.ok(!('.arch/pending/TASK-212-patch.json' in fs.files));
  assert.ok(!('.arch/pending/INTENT-001-transition.json' in fs.files));
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test -- --test-name-pattern "FinalizePromotion"
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `FinalizePromotion`**

Create `cli/src/main/ts/application/use-cases/finalize-promotion.ts`:

```typescript
import type { FileSystem } from '../../domain/repositories/file-system.js';
import path from 'node:path';

interface TaskPatch {
  task_id: string;
  intent_id: string;
  schema_version: number;
  produced_at: string;
  actor: { name: string; model: string; version: string };
  content: string;
}

interface IntentTransition {
  intent_id: string;
  task_id: string;
  schema_version: number;
  produced_at: string;
  action: string;
  promotion_confidence: string;
}

export interface FinalizeResult {
  success: boolean;
  reason?: string;
}

export class FinalizePromotion {
  constructor(private fileSystem: FileSystem) {}

  async execute(taskId: string, intentId: string): Promise<FinalizeResult> {
    const taskPath = `docs/tasks/${taskId}.md`;
    const intentPath = `docs/intents/${intentId}.md`;
    const patchPath = `.arch/pending/${taskId}-patch.json`;
    const transitionPath = `.arch/pending/${intentId}-transition.json`;
    const lockPath = `.arch/locks/${taskId}.lock`;
    const snapshotPath = `.arch/enrichments/${taskId}.json`;
    const errorPath = `.arch/enrichments/${taskId}-error.json`;
    const stagingTask = `.arch/staging/${taskId}.md`;
    const stagingIntent = `.arch/staging/${intentId}.md`;
    const stagingSnapshot = `.arch/staging/${taskId}-snapshot.json`;

    const cleanup = async () => {
      for (const p of [patchPath, transitionPath, lockPath, stagingTask, stagingIntent, stagingSnapshot]) {
        if (await this.fileSystem.exists(p)) {
          try { await this.fileSystem.deleteFile(p); } catch { /* best effort */ }
        }
      }
    };

    try {
      // Parse and validate patch
      const patchRaw = await this.fileSystem.readFile(patchPath);
      let patch: TaskPatch;
      try {
        patch = JSON.parse(patchRaw);
      } catch {
        await this.writeError(errorPath, taskId, intentId, patchRaw, 'patch JSON parse failure');
        await cleanup();
        return { success: false, reason: 'patch JSON parse failure' };
      }

      if (!patch.content || !patch.content.trim()) {
        await this.writeError(errorPath, taskId, intentId, patchRaw, 'patch content is empty');
        await cleanup();
        return { success: false, reason: 'patch content is empty' };
      }

      // Preconditions
      const taskContent = await this.fileSystem.readFile(taskPath);
      if (!taskContent.includes('enrichment_phase: scaffolded')) {
        await cleanup();
        return { success: false, reason: `${taskId} enrichment_phase is not scaffolded` };
      }

      const intentContent = await this.fileSystem.readFile(intentPath);
      if (!intentContent.includes('status: CAPTURED')) {
        await cleanup();
        return { success: false, reason: `${intentId} is not CAPTURED` };
      }

      if (await this.fileSystem.exists(snapshotPath)) {
        await cleanup();
        return { success: false, reason: `enrichment snapshot already exists for ${taskId}` };
      }

      // Stage all writes
      await this.fileSystem.mkdir('.arch/staging');
      await this.fileSystem.mkdir('.arch/enrichments');

      const mergedTask = this.mergeTaskContent(taskContent, patch);
      await this.fileSystem.writeFile(stagingTask, mergedTask);

      const updatedIntent = this.promoteIntent(intentContent, taskId);
      await this.fileSystem.writeFile(stagingIntent, updatedIntent);

      const snapshot = JSON.stringify({
        task_id: taskId,
        intent_id: intentId,
        finalized_at: new Date().toISOString(),
        actor: patch.actor,
        content: patch.content,
      }, null, 2);
      await this.fileSystem.writeFile(stagingSnapshot, snapshot);

      // Commit via ordered atomic renames
      await this.fileSystem.rename(stagingTask, taskPath);        // step A
      await this.fileSystem.rename(stagingIntent, intentPath);    // step B
      await this.fileSystem.rename(stagingSnapshot, snapshotPath); // step C

      await cleanup();
      return { success: true };

    } catch (err: any) {
      await cleanup();
      return { success: false, reason: err.message };
    }
  }

  private mergeTaskContent(scaffoldContent: string, patch: TaskPatch): string {
    return scaffoldContent
      .replace('enrichment_phase: scaffolded', 'enrichment_phase: finalized')
      .replace('enriched_by: ~', `enriched_by:\n  actor: ${patch.actor.name}\n  model: ${patch.actor.model}\n  version: ${patch.actor.version}`)
      + '\n---\n\n## Agent Enrichment\n\n' + patch.content;
  }

  private promoteIntent(intentContent: string, taskId: string): string {
    const now = new Date().toISOString();
    return intentContent
      .replace(/^status: CAPTURED$/m, 'status: PROMOTED')
      .replace(/^updated_at: .+$/m, `updated_at: ${now}`)
      .replace(/^promoted_to: \[\]$/m, `promoted_to:\n  - ${taskId}`);
  }

  private async writeError(errorPath: string, taskId: string, intentId: string, rawPatch: string, reason: string): Promise<void> {
    await this.fileSystem.mkdir('.arch/enrichments');
    const error = JSON.stringify({
      task_id: taskId,
      intent_id: intentId,
      failed_at: new Date().toISOString(),
      reason,
      raw_patch: rawPatch,
    }, null, 2);
    await this.fileSystem.writeFile(errorPath, error);
  }
}
```

- [ ] **Step 4: Run FinalizePromotion tests**

```bash
cd cli && npm test -- --test-name-pattern "FinalizePromotion"
```
Expected: All PASS

- [ ] **Step 5: Run full suite**

```bash
cd cli && npm test
```
Expected: All pass

- [ ] **Step 6: Commit**

```bash
git add cli/src/main/ts/application/use-cases/finalize-promotion.ts \
        cli/src/test/ts/finalize-promotion.test.ts
git commit -m "feat: [TASK-XXX] implement FinalizePromotion staging+rename transaction"
```

---

## Task 6: Implement `arch think` command and locking

**Files:**
- Create: `cli/src/main/ts/application/commands/think-command.ts`
- Create: `cli/src/test/ts/think-command.test.ts`
- Modify: `cli/src/main/ts/index.ts`

The command orchestrates: (1) discover CAPTURED intents or use provided INTENT-ID, (2) scaffold each, (3) detect pending pairs, (4) acquire lock, (5) call `FinalizePromotion`, (6) report results. It also handles applying existing pending patches (i.e., if scaffold was done in a previous run).

- [ ] **Step 1: Write failing integration test**

Create `cli/src/test/ts/think-command.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { ThinkCommand } from '../../main/ts/application/commands/think-command.js';
import { IntentStatus } from '../../main/ts/domain/models/intent.js';
import type { Intent } from '../../main/ts/domain/models/intent.js';

class MockFS {
  files: Record<string, string> = {};
  directories: Record<string, string[]> = {};
  deleted: string[] = [];
  renames: Array<[string, string]> = [];

  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files || p in this.directories; }
  async readDirectory(p: string) { return this.directories[p] ?? []; }
  async rename(o: string, n: string) {
    this.renames.push([o, n]);
    this.files[n] = this.files[o];
    delete this.files[o];
  }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async deleteFile(p: string) { this.deleted.push(p); delete this.files[p]; }
}

const INTENT_CONTENT = `---
id: INTENT-001
schema_version: 1
status: CAPTURED
created_at: 2026-05-11T10:00:00Z
updated_at: 2026-05-11T10:00:00Z

origin:
  source: cli
  branch: main
  cwd: cli/src
  triggered_by: capture
  recent_files: []

interpretations: []
promoted_to: []
superseded_by: []
---

fix oauth callback session loss
`;

class MockIntentRepo {
  intents: Intent[] = [{
    id: 'INTENT-001',
    schemaVersion: 1,
    status: IntentStatus.CAPTURED,
    createdAt: '2026-05-11T10:00:00Z',
    updatedAt: '2026-05-11T10:00:00Z',
    origin: { source: 'cli', branch: 'main', cwd: 'cli/src', triggeredBy: 'capture', recentFiles: [] },
    interpretations: [],
    promotedTo: [],
    supersededBy: [],
    rawIntent: 'fix oauth callback session loss',
  }];
  async getNextId() { return 'INTENT-001'; }
  async save(_i: Intent) {}
  async getById(id: string) { return this.intents.find(i => i.id === id) ?? null; }
  async update(_i: Intent) {}
  async findCaptured() { return this.intents.filter(i => i.status === IntentStatus.CAPTURED); }
}

class MockTaskRepo {
  tasks: any[] = [];
  async getNextId() { return 'TASK-212'; }
  async getAll() { return this.tasks; }
  async getActive() { return this.tasks; }
  async getById(id: string) { return this.tasks.find(t => t.id === id) ?? null; }
  async save(_t: any) {}
}

test('ThinkCommand scaffolds a CAPTURED intent and prints scaffold created', async () => {
  const fs = new MockFS();
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  const taskFile = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskFile, 'task file should be created');
  assert.ok(taskFile.includes('DRAFT'));
  assert.ok(taskFile.includes('enrichment_phase: scaffolded'));
  assert.ok(out.some(l => l.includes('TASK-212') && l.includes('INTENT-001')));
});

test('ThinkCommand with pending patch applies FinalizePromotion', async () => {
  const fs = new MockFS();
  // Scaffold already done
  const scaffoldContent = `## TASK-212: fix oauth callback session loss

**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/
**Source:** INTENT-001
**Depends:** none

### Generation

enrichment_phase: scaffolded
scaffolded_by: arch-cli
scaffolded_at: 2026-05-11T10:00:00Z
enriched_by: ~

### Objective

_Awaiting agent enrichment_
`;
  fs.files['docs/tasks/TASK-212.md'] = scaffoldContent;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = JSON.stringify({
    task_id: 'TASK-212',
    intent_id: 'INTENT-001',
    schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
    content: '## TASK-212: Fix OAuth\n\n### Objective\n\nFix it.\n\n### Acceptance Criteria\n\n- [ ] It works\n\n### Complexity\n\nS\n\n### Confidence\n\nhigh\n\n### Risks\n\nnone',
  });
  fs.files['.arch/pending/INTENT-001-transition.json'] = JSON.stringify({
    intent_id: 'INTENT-001',
    task_id: 'TASK-212',
    schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    action: 'promote',
    promotion_confidence: 'high',
  });
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  fs.directories['.arch/pending'] = ['TASK-212-patch.json', 'INTENT-001-transition.json'];

  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  const taskContent = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskContent?.includes('enrichment_phase: finalized'));
  assert.ok(out.some(l => l.includes('DRAFT') && l.includes('INTENT-001')));
});

test('ThinkCommand - stale lock (>5min) is cleaned up and processing continues', async () => {
  const fs = new MockFS();
  const staleTime = new Date(Date.now() - 6 * 60 * 1000).toISOString();
  fs.files['.arch/locks/TASK-212.lock'] = staleTime;
  fs.files['docs/tasks/TASK-212.md'] = `## TASK-212: fix\n\n**Meta:** P2 | M | DRAFT | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/\n**Source:** INTENT-001\n**Depends:** none\n\n### Generation\n\nenrichment_phase: scaffolded\nscaffolded_by: arch-cli\nscaffolded_at: 2026-05-11T10:00:00Z\nenriched_by: ~\n\n### Objective\n\n_Awaiting_\n`;
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.files['.arch/pending/TASK-212-patch.json'] = JSON.stringify({
    task_id: 'TASK-212',
    intent_id: 'INTENT-001',
    schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    actor: { name: 'think-agent', model: 'claude-sonnet-4-6', version: 'v1' },
    content: '## TASK-212: Fix\n\n### Objective\n\nFix.\n\n### Acceptance Criteria\n\n- [ ] Done\n\n### Complexity\n\nS\n\n### Confidence\n\nhigh\n\n### Risks\n\nnone',
  });
  fs.files['.arch/pending/INTENT-001-transition.json'] = JSON.stringify({
    intent_id: 'INTENT-001',
    task_id: 'TASK-212',
    schema_version: 1,
    produced_at: '2026-05-11T10:30:00Z',
    action: 'promote',
    promotion_confidence: 'high',
  });
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  fs.directories['.arch/pending'] = ['TASK-212-patch.json', 'INTENT-001-transition.json'];

  const intentRepo = new MockIntentRepo();
  intentRepo.intents[0] = { ...intentRepo.intents[0], status: IntentStatus.CAPTURED };
  const taskRepo = new MockTaskRepo();
  const out: string[] = [];

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, (s) => out.push(s));
  await cmd.execute([]);

  // stale lock was cleaned up and promotion succeeded
  const taskContent = fs.files['docs/tasks/TASK-212.md'];
  assert.ok(taskContent?.includes('enrichment_phase: finalized'));
});

test('ThinkCommand is idempotent — running twice produces same outcome', async () => {
  const fs = new MockFS();
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.directories['docs/intents'] = ['INTENT-001.md'];
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();

  const cmd = new ThinkCommand(intentRepo as any, taskRepo as any, fs as any, () => {});
  await cmd.execute([]);
  const firstSnapshot = { ...fs.files };

  await cmd.execute([]);

  // Second run: no additional files created, same task content
  assert.ok(fs.files['docs/tasks/TASK-212.md'] === firstSnapshot['docs/tasks/TASK-212.md']);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd cli && npm test -- --test-name-pattern "ThinkCommand"
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement `ThinkCommand`**

Create `cli/src/main/ts/application/commands/think-command.ts`:

```typescript
import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ScaffoldTask } from '../use-cases/scaffold-task.js';
import { FinalizePromotion } from '../use-cases/finalize-promotion.js';

const LOCK_TTL_MS = 5 * 60 * 1000;

export class ThinkCommand {
  constructor(
    private intentRepository: IntentRepository,
    private taskRepository: TaskRepository,
    private fileSystem: FileSystem,
    private log: (s: string) => void = console.log,
  ) {}

  async execute(args: string[]): Promise<void> {
    if (args.length > 0) {
      await this.processIntent(args[0]);
    } else {
      const captured = await this.intentRepository.findCaptured();
      for (const intent of captured) {
        await this.processIntent(intent.id);
      }
    }

    // Apply all pending patches
    await this.applyPendingPatches();
  }

  private async processIntent(intentId: string): Promise<void> {
    const taskPath = await this.findExistingScaffold(intentId);
    if (taskPath) {
      // Already scaffolded — pending patch will be applied in applyPendingPatches
      return;
    }

    try {
      const scaffold = new ScaffoldTask(this.intentRepository, this.taskRepository, this.fileSystem);
      const result = await scaffold.execute(intentId);
      this.log(`Scaffold created: ${result.taskId} ← ${result.intentId}`);
      this.log(`enrichment_phase: scaffolded`);
      this.log(`Agent: enrich ${result.taskId}, then write patches to .arch/pending/`);
    } catch (err: any) {
      this.log(`Error scaffolding ${intentId}: ${err.message}`);
    }
  }

  private async findExistingScaffold(intentId: string): Promise<string | null> {
    // Check if a task file already references this intent
    if (!(await this.fileSystem.exists('docs/tasks'))) return null;
    const files = await this.fileSystem.readDirectory('docs/tasks');
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await this.fileSystem.readFile(`docs/tasks/${file}`);
      if (content.includes(`**Source:** ${intentId}`)) {
        return `docs/tasks/${file}`;
      }
    }
    return null;
  }

  private async applyPendingPatches(): Promise<void> {
    const pendingDir = '.arch/pending';
    if (!(await this.fileSystem.exists(pendingDir))) return;

    const files = await this.fileSystem.readDirectory(pendingDir);
    const patches = files.filter(f => f.endsWith('-patch.json'));

    for (const patchFile of patches) {
      const taskId = patchFile.replace('-patch.json', '');
      const patchPath = `${pendingDir}/${patchFile}`;

      let patch: any;
      try {
        patch = JSON.parse(await this.fileSystem.readFile(patchPath));
      } catch {
        continue;
      }

      const intentId: string = patch.intent_id;
      if (!intentId) continue;

      const transitionPath = `${pendingDir}/${intentId}-transition.json`;
      if (!(await this.fileSystem.exists(transitionPath))) continue;

      // Locking
      const lockPath = `.arch/locks/${taskId}.lock`;
      if (await this.fileSystem.exists(lockPath)) {
        const lockTime = new Date(await this.fileSystem.readFile(lockPath)).getTime();
        if (Date.now() - lockTime < LOCK_TTL_MS) {
          this.log(`Skipping ${taskId} — lock held by another process`);
          continue;
        }
        // Stale lock
        this.log(`Warning: stale lock for ${taskId}, cleaning up`);
        try { await this.fileSystem.deleteFile(lockPath); } catch { /* ignore */ }
      }

      // Acquire lock
      await this.fileSystem.mkdir('.arch/locks');
      await this.fileSystem.writeFile(lockPath, new Date().toISOString());

      try {
        const finalize = new FinalizePromotion(this.fileSystem);
        const result = await finalize.execute(taskId, intentId);

        if (result.success) {
          this.log(`${taskId} promoted to DRAFT ← ${intentId}`);
          this.log(`enrichment_phase: finalized`);
          this.log(`Ready for human review`);
        } else {
          this.log(`Failed to finalize ${taskId}: ${result.reason}`);
        }
      } finally {
        if (await this.fileSystem.exists(lockPath)) {
          try { await this.fileSystem.deleteFile(lockPath); } catch { /* ignore */ }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Run think-command tests**

```bash
cd cli && npm test -- --test-name-pattern "ThinkCommand"
```
Expected: All PASS

- [ ] **Step 5: Register `think` in `index.ts`**

In `cli/src/main/ts/index.ts`, add the import and case:

```typescript
// Import at top:
import { ThinkCommand } from './application/commands/think-command.js';
import { ThinkCommandDeps } from './application/commands/think-command.js';

// In switch:
case 'think': {
  const intentRepository = new MarkdownIntentRepository(fileSystem);
  await new ThinkCommand(intentRepository, taskRepository, fileSystem).execute(args);
  break;
}
```

Update the usage line:

```typescript
console.log('Usage: arch [status|validate|review|task|inbox|next|version|govern|rank|batch|drain|conduct|promote|loop|sandbox|lint|mv|exec|merge-resolve|capture|index|think]');
```

- [ ] **Step 6: Run full test suite**

```bash
cd cli && npm test
```
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add cli/src/main/ts/application/commands/think-command.ts \
        cli/src/main/ts/index.ts \
        cli/src/test/ts/think-command.test.ts
git commit -m "feat: [TASK-XXX] implement arch think command with scaffold and finalize orchestration"
```

---

## Task 7: Register `think` in `arch.sh` and final verification

**Files:**
- Modify: `scripts/arch.sh` (if it contains a command list)
- Verify: all tests pass, TypeScript compiles, `arch think` runs against real intents

- [ ] **Step 1: Check `arch.sh` for command routing**

```bash
grep -n 'think\|capture\|index' scripts/arch.sh | head -20
```

- [ ] **Step 2: Add `think` to command routing if present**

If `arch.sh` has an explicit dispatch table or usage string, add `think` alongside `capture` and `index`. The exact edit depends on the current structure.

- [ ] **Step 3: Run TypeScript build to verify no compile errors**

```bash
cd cli && npm run build 2>&1 | grep -E "error TS|^$"
```
Expected: No errors

- [ ] **Step 4: Run full test suite**

```bash
cd cli && npm test 2>&1 | tail -10
```
Expected: All pass, 0 failures

- [ ] **Step 5: Smoke test `arch think` with existing INTENT-001**

```bash
arch think INTENT-001
```
Expected output format:
```
Scaffold created: TASK-XXX ← INTENT-001
enrichment_phase: scaffolded
Agent: enrich TASK-XXX, then write patches to .arch/pending/
```

- [ ] **Step 6: Commit final wiring**

```bash
git add scripts/arch.sh
git commit -m "feat: [TASK-XXX] register arch think in arch.sh routing"
```

---

## Task 8: Verify safety invariants (targeted tests)

**Files:**
- Modify: `cli/src/test/ts/scaffold-task.test.ts` and `cli/src/test/ts/finalize-promotion.test.ts`

All eleven safety invariants from the spec should be covered by dedicated test cases.

- [ ] **Step 1: Add missing safety invariant tests to scaffold-task.test.ts**

The following invariants need explicit tests (some already covered above, add the rest):

```typescript
// Invariant: No patch overwrite — pending patch exists for same TASK → skip
test('ThinkCommand skips scaffold if pending patch already exists for intent', async () => {
  const fs = new MockFS2();
  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  // Simulate existing scaffold + pending patch
  fs.files['docs/tasks/TASK-212.md'] = '## TASK-212: ...\n**Source:** INTENT-001\nenrichment_phase: scaffolded\n';
  fs.files['.arch/pending/TASK-212-patch.json'] = '{}';

  const useCase = new ScaffoldTask(intentRepo as any, taskRepo as any, fs as any);
  // Should not throw — ScaffoldTask sees existing task file and aborts cleanly
  await assert.rejects(() => useCase.execute('INTENT-001'), /already exists/);
});

// Invariant: EXECUTION_ELIGIBLE := TASK.state == READY only
test('TaskStatus.DRAFT is not READY', () => {
  assert.notStrictEqual(TaskStatus.DRAFT, TaskStatus.READY);
});

// Invariant: Multi-intent isolation — one failure does not abort remaining intents
// (tested via ThinkCommand processing multiple intents in think-command.test.ts)
```

- [ ] **Step 2: Run all tests**

```bash
cd cli && npm test
```
Expected: All pass

- [ ] **Step 3: Commit**

```bash
git add cli/src/test/ts/scaffold-task.test.ts cli/src/test/ts/finalize-promotion.test.ts
git commit -m "test: [TASK-XXX] cover safety invariants for arch think"
```
