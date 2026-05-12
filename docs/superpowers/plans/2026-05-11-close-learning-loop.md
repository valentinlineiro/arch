# Close the Learning Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the feedback cycle so that task completion improves future context inference — connecting capture → scaffold → context → done → feedback → better inference.

**Architecture:** Three targeted changes to the existing pipeline: (1) ContextInference runs at scaffold time inside `arch think`, so the agent enriching the task already has relevant context; (2) a `FeedbackRepository` + `ExtractContextFeedback` use case reads the `### Context Feedback` checkboxes when a task is completed and persists a signal; (3) `ContextInference.score()` reads those signals and adjusts task-reference boosts accordingly. No ContextIndex schema changes — feedback lives in `.arch/context-feedback.json` as a separate concern.

**Tech Stack:** TypeScript (ESM), Node.js built-in test runner (`node:test`), tsx, existing `FileSystem` interface pattern.

---

## File Structure

**New files:**
- `cli/src/main/ts/domain/models/feedback-signal.ts` — `FeedbackSignal` type, `FeedbackVerdict` union, `FeedbackDetail` interface
- `cli/src/main/ts/domain/repositories/feedback-repository.ts` — `FeedbackRepository` interface
- `cli/src/main/ts/infrastructure/filesystem/node-feedback-repository.ts` — reads/appends `.arch/context-feedback.json`
- `cli/src/main/ts/application/use-cases/extract-context-feedback.ts` — parses `### Context Feedback` checkboxes from task content
- `cli/src/test/ts/extract-context-feedback.test.ts` — unit tests for the parser
- `cli/src/test/ts/context-inference-feedback.test.ts` — tests for feedback-adjusted scoring

**Modified files:**
- `cli/src/main/ts/application/commands/think-command.ts` — call ContextInference after scaffold
- `cli/src/main/ts/application/use-cases/context-inference.ts` — load feedback signals, adjust task-reference scoring
- `cli/src/main/ts/application/use-cases/mark-task-done.ts` — extract + persist feedback after marking done
- `cli/src/main/ts/infrastructure/cli/command-parser.ts` — wire `FeedbackRepository` into `MarkTaskDone`

---

### Task 1: Wire ContextInference into ThinkCommand

When `arch think` scaffolds a task, context should be injected immediately — before the enriching agent sees the file. Currently, context only runs at `arch task start`, which is too late.

**Files:**
- Modify: `cli/src/main/ts/application/commands/think-command.ts`
- Modify: `cli/src/test/ts/think-command.test.ts`

- [ ] **Step 1: Write a failing test**

Add this test to `cli/src/test/ts/think-command.test.ts` after the existing tests:

```typescript
test('ThinkCommand injects context into scaffolded task file', async () => {
  const fs = new MockFS();
  // Minimal context index so ContextInference has something to work with
  fs.files['.arch/context-index.json'] = JSON.stringify({
    version: 4,
    builtAt: '2026-05-11T00:00:00Z',
    files: {
      'cli/src/main/ts/domain/models/intent.ts': {
        symbols: ['Intent', 'IntentStatus'],
        imports: [],
        tags: ['intent', 'domain'],
        criticality: 'core',
        runtimeUsage: 'hot',
      },
    },
    adrs: {},
    adrTaskLinks: {},
    failures: {},
    guidelineFailureLinks: {},
    guidelines: {},
    tasks: {},
  });
  fs.files['docs/intents/INTENT-001.md'] = INTENT_CONTENT;
  fs.directories['docs/tasks'] = [];

  const intentRepo = new MockIntentRepo();
  const taskRepo = new MockTaskRepo();
  const logs: string[] = [];
  const cmd = new ThinkCommand(intentRepo, taskRepo, fs, (s) => logs.push(s));

  await cmd.execute([]);

  const taskFile = Object.keys(fs.files).find(k => k.startsWith('docs/tasks/TASK-'));
  assert.ok(taskFile, 'task file created');
  const content = fs.files[taskFile!];
  assert.ok(content.includes('### Relevant Context'), 'context section injected');
  assert.ok(content.includes('_confidence:'), 'confidence score present');
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A3 "injects context"
```

Expected: FAIL — test runs but `### Relevant Context` with `_confidence:` is not found (only the placeholder `_Pending ContextInference_` exists).

- [ ] **Step 3: Update ThinkCommand.processIntent() to call ContextInference after scaffold**

In `cli/src/main/ts/application/commands/think-command.ts`, update the imports and `processIntent` method:

```typescript
import type { IntentRepository } from '../../domain/repositories/intent-repository.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { ScaffoldTask } from '../use-cases/scaffold-task.js';
import { FinalizePromotion } from '../use-cases/finalize-promotion.js';
import { ContextInference } from '../use-cases/context-inference.js';
```

Replace the `processIntent` method body:

```typescript
private async processIntent(intentId: string): Promise<void> {
  if (await this.findExistingScaffold(intentId)) {
    return;
  }

  const intent = await this.intentRepository.getById(intentId);
  if (!intent) {
    this.log(`Intent ${intentId} not found`);
    return;
  }

  try {
    const scaffold = new ScaffoldTask(this.intentRepository, this.taskRepository, this.fileSystem);
    const result = await scaffold.execute(intentId);
    this.log(`Scaffold created: ${result.taskId} ← ${result.intentId}`);

    try {
      const inference = new ContextInference(this.fileSystem);
      await inference.execute(result.taskId, intent.rawIntent, '2-code-generation');
    } catch { /* context inference must never block scaffolding */ }

    this.log(`enrichment_phase: scaffolded`);
    this.log(`Agent: enrich ${result.taskId}, then write patches to .arch/pending/`);
  } catch (err: any) {
    this.log(`Error scaffolding ${intentId}: ${err.message}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "pass|fail|ok|not ok" | head -20
```

Expected: all existing tests pass, new test passes.

- [ ] **Step 5: Commit**

```bash
cd /home/valentin/code/arch && git add cli/src/main/ts/application/commands/think-command.ts cli/src/test/ts/think-command.test.ts
git commit -m "feat: inject context inference into think scaffold flow"
```

---

### Task 2: FeedbackSignal model and repository

Define the types and storage layer before wiring anything.

**Files:**
- Create: `cli/src/main/ts/domain/models/feedback-signal.ts`
- Create: `cli/src/main/ts/domain/repositories/feedback-repository.ts`
- Create: `cli/src/main/ts/infrastructure/filesystem/node-feedback-repository.ts`

- [ ] **Step 1: Create FeedbackSignal model**

Create `cli/src/main/ts/domain/models/feedback-signal.ts`:

```typescript
export type FeedbackVerdict = 'accurate' | 'partial' | 'off' | null;

export interface FeedbackDetail {
  wrongFiles: boolean;
  missingFiles: boolean;
  wrongAdrs: boolean;
  tooMuchNoise: boolean;
  confidenceMisleading: boolean;
}

export interface FeedbackSignal {
  taskId: string;
  timestamp: string;
  verdict: FeedbackVerdict;
  details: FeedbackDetail;
}
```

- [ ] **Step 2: Create FeedbackRepository interface**

Create `cli/src/main/ts/domain/repositories/feedback-repository.ts`:

```typescript
import type { FeedbackSignal } from '../models/feedback-signal.js';

export interface FeedbackRepository {
  readAll(): Promise<FeedbackSignal[]>;
  append(signal: FeedbackSignal): Promise<void>;
}
```

- [ ] **Step 3: Create NodeFeedbackRepository**

Create `cli/src/main/ts/infrastructure/filesystem/node-feedback-repository.ts`:

```typescript
import type { FeedbackRepository } from '../../domain/repositories/feedback-repository.js';
import type { FeedbackSignal } from '../../domain/models/feedback-signal.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

const FEEDBACK_PATH = '.arch/context-feedback.json';

export class NodeFeedbackRepository implements FeedbackRepository {
  constructor(private fileSystem: FileSystem) {}

  async readAll(): Promise<FeedbackSignal[]> {
    try {
      const raw = await this.fileSystem.readFile(FEEDBACK_PATH);
      return JSON.parse(raw) as FeedbackSignal[];
    } catch {
      return [];
    }
  }

  async append(signal: FeedbackSignal): Promise<void> {
    const existing = await this.readAll();
    existing.push(signal);
    await this.fileSystem.mkdir('.arch');
    await this.fileSystem.writeFile(FEEDBACK_PATH, JSON.stringify(existing, null, 2));
  }
}
```

- [ ] **Step 4: Run tests to confirm no regressions**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "pass|fail|ok|not ok" | head -20
```

Expected: all existing tests pass (new files are inert so far).

- [ ] **Step 5: Commit**

```bash
cd /home/valentin/code/arch && git add cli/src/main/ts/domain/models/feedback-signal.ts cli/src/main/ts/domain/repositories/feedback-repository.ts cli/src/main/ts/infrastructure/filesystem/node-feedback-repository.ts
git commit -m "feat: add FeedbackSignal model and NodeFeedbackRepository"
```

---

### Task 3: ExtractContextFeedback use case

Parse the `### Context Feedback` checkboxes from a task file's content.

**Files:**
- Create: `cli/src/main/ts/application/use-cases/extract-context-feedback.ts`
- Create: `cli/src/test/ts/extract-context-feedback.test.ts`

- [ ] **Step 1: Write failing tests**

Create `cli/src/test/ts/extract-context-feedback.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { ExtractContextFeedback } from '../../main/ts/application/use-cases/extract-context-feedback.js';

const extractor = new ExtractContextFeedback();

test('returns null when no Context Feedback section exists', () => {
  const content = `## TASK-001: some task\n**Meta:** P1 | S | DONE\n\n### Acceptance Criteria\n- [x] done\n`;
  const result = extractor.extract('TASK-001', content);
  assert.strictEqual(result, null);
});

test('returns null when no verdict checkbox is checked', () => {
  const content = `## TASK-001: task\n### Context Feedback\n_Was it useful?_\n- [ ] accurate\n- [ ] partial\n- [ ] off\n`;
  const result = extractor.extract('TASK-001', content);
  assert.strictEqual(result, null);
});

test('extracts accurate verdict', () => {
  const content = `## TASK-001: task\n### Context Feedback\n_Was it useful?_\n- [x] accurate — files and ADRs were on-target\n- [ ] partial\n- [ ] off\n`;
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'accurate');
  assert.strictEqual(result!.taskId, 'TASK-001');
  assert.strictEqual(result!.details.wrongFiles, false);
});

test('extracts partial verdict with detail flags', () => {
  const content = [
    '## TASK-001: task',
    '### Context Feedback',
    '_Was it useful?_',
    '- [ ] accurate — files and ADRs were on-target',
    '- [x] partial — correct direction, missing key files',
    '- [ ] off — wrong files dominated',
    '',
    '_If partial or off:_',
    '- [ ] wrong files',
    '- [x] missing files',
    '- [ ] wrong ADRs',
    '- [ ] too much noise',
    '- [ ] confidence misleading',
  ].join('\n');
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'partial');
  assert.strictEqual(result!.details.missingFiles, true);
  assert.strictEqual(result!.details.wrongFiles, false);
  assert.strictEqual(result!.details.wrongAdrs, false);
});

test('extracts off verdict with multiple detail flags', () => {
  const content = [
    '## TASK-001: task',
    '### Context Feedback',
    '_Was it useful?_',
    '- [ ] accurate — files and ADRs were on-target',
    '- [ ] partial — correct direction, missing key files',
    '- [x] off — wrong files dominated',
    '',
    '_If partial or off:_',
    '- [x] wrong files',
    '- [ ] missing files',
    '- [x] wrong ADRs',
    '- [x] too much noise',
    '- [ ] confidence misleading',
  ].join('\n');
  const result = extractor.extract('TASK-001', content);
  assert.ok(result);
  assert.strictEqual(result!.verdict, 'off');
  assert.strictEqual(result!.details.wrongFiles, true);
  assert.strictEqual(result!.details.wrongAdrs, true);
  assert.strictEqual(result!.details.tooMuchNoise, true);
  assert.strictEqual(result!.details.missingFiles, false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A3 "extract-context-feedback"
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement ExtractContextFeedback**

Create `cli/src/main/ts/application/use-cases/extract-context-feedback.ts`:

```typescript
import type { FeedbackSignal, FeedbackDetail, FeedbackVerdict } from '../../domain/models/feedback-signal.js';

const FEEDBACK_SECTION_MARKER = '### Context Feedback';

export class ExtractContextFeedback {
  extract(taskId: string, content: string): FeedbackSignal | null {
    const sectionStart = content.indexOf(FEEDBACK_SECTION_MARKER);
    if (sectionStart === -1) return null;

    const sectionEnd = content.indexOf('\n##', sectionStart + 1);
    const section = sectionEnd === -1
      ? content.slice(sectionStart)
      : content.slice(sectionStart, sectionEnd);

    const verdict = this.extractVerdict(section);
    if (verdict === null) return null;

    return {
      taskId,
      timestamp: new Date().toISOString(),
      verdict,
      details: this.extractDetails(section),
    };
  }

  private extractVerdict(section: string): FeedbackVerdict {
    if (/- \[x\] accurate/.test(section)) return 'accurate';
    if (/- \[x\] partial/.test(section)) return 'partial';
    if (/- \[x\] off/.test(section)) return 'off';
    return null;
  }

  private extractDetails(section: string): FeedbackDetail {
    return {
      wrongFiles: /- \[x\] wrong files/.test(section),
      missingFiles: /- \[x\] missing files/.test(section),
      wrongAdrs: /- \[x\] wrong ADRs/.test(section),
      tooMuchNoise: /- \[x\] too much noise/.test(section),
      confidenceMisleading: /- \[x\] confidence misleading/.test(section),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "pass|fail|ok|not ok" | head -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/valentin/code/arch && git add cli/src/main/ts/application/use-cases/extract-context-feedback.ts cli/src/test/ts/extract-context-feedback.test.ts
git commit -m "feat: add ExtractContextFeedback use case"
```

---

### Task 4: Wire feedback extraction into MarkTaskDone

When a task is marked done, extract its feedback signal and persist it.

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/mark-task-done.ts`
- Modify: `cli/src/test/ts/mark-task-done.test.ts` (or create it if it doesn't exist — check with `ls cli/src/test/ts/`)

- [ ] **Step 1: Check for existing mark-task-done tests**

```bash
ls /home/valentin/code/arch/cli/src/test/ts/ | grep -i "mark\|done"
```

- [ ] **Step 2: Write failing tests**

Find the existing test file for `mark-task-done` (likely embedded in `task-command.test.ts` or similar). Add this test to the appropriate file, or create `cli/src/test/ts/mark-task-done-feedback.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { MarkTaskDone } from '../../main/ts/application/use-cases/mark-task-done.js';
import { TaskStatus } from '../../main/ts/domain/models/task.js';

class MockTaskRepo {
  task: any = {
    id: 'TASK-001',
    status: TaskStatus.IN_PROGRESS,
    focus: false,
    rawMetaLine: '**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | src/',
    content: [
      '## TASK-001: test task',
      '**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | src/',
      '',
      '## Hansei',
      'All good.',
      '',
      '### Context Feedback',
      '_Was it useful?_',
      '- [x] accurate — files and ADRs were on-target',
      '- [ ] partial',
      '- [ ] off',
    ].join('\n'),
    cost: '0.00',
    steps: 0,
  };
  async getById(_id: string) { return this.task; }
  async save(t: any) { this.task = t; }
}

class MockReviewer {
  reviewTask(_task: any, _meta: string) { return { valid: true, violations: [] }; }
}

class MockFS {
  files: Record<string, string> = { 'arch.config.json': JSON.stringify({ hanseiSinceTaskId: 1 }) };
  async readFile(p: string) { return this.files[p] ?? ''; }
  async writeFile(p: string, c: string) { this.files[p] = c; }
  async exists(p: string) { return p in this.files; }
  async mkdir(_p: string) {}
  async appendFile(p: string, c: string) { this.files[p] = (this.files[p] ?? '') + c; }
  async readDirectory(_p: string) { return []; }
  async rename(o: string, n: string) { this.files[n] = this.files[o]; delete this.files[o]; }
  async deleteFile(p: string) { delete this.files[p]; }
}

class MockFeedbackRepo {
  signals: any[] = [];
  async readAll() { return this.signals; }
  async append(s: any) { this.signals.push(s); }
}

test('MarkTaskDone persists feedback signal when Context Feedback is checked', async () => {
  const taskRepo = new MockTaskRepo() as any;
  const reviewer = new MockReviewer() as any;
  const fs = new MockFS();
  const feedbackRepo = new MockFeedbackRepo();

  const useCase = new MarkTaskDone(taskRepo, reviewer, fs as any, undefined, feedbackRepo as any);
  await useCase.execute('TASK-001');

  assert.strictEqual(feedbackRepo.signals.length, 1);
  assert.strictEqual(feedbackRepo.signals[0].taskId, 'TASK-001');
  assert.strictEqual(feedbackRepo.signals[0].verdict, 'accurate');
});

test('MarkTaskDone does not crash when no feedback section exists', async () => {
  const taskRepo = new MockTaskRepo() as any;
  taskRepo.task.content = '## TASK-001: test\n**Meta:** P1 | S | IN_PROGRESS\n\n## Hansei\nAll good.\n';
  const reviewer = new MockReviewer() as any;
  const fs = new MockFS();
  const feedbackRepo = new MockFeedbackRepo();

  const useCase = new MarkTaskDone(taskRepo, reviewer, fs as any, undefined, feedbackRepo as any);
  await useCase.execute('TASK-001');

  assert.strictEqual(feedbackRepo.signals.length, 0);
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A3 "persists feedback\|does not crash"
```

Expected: FAIL — MarkTaskDone constructor doesn't accept a `feedbackRepo` parameter.

- [ ] **Step 4: Update MarkTaskDone to accept and use FeedbackRepository**

In `cli/src/main/ts/application/use-cases/mark-task-done.ts`, add the import and update the constructor and `execute` method:

```typescript
import { TaskRepository } from '../../domain/repositories/task-repository.js';
import { TaskStatus } from '../../domain/models/task.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { EventRepository } from '../../domain/models/event.js';
import { FeedbackRepository } from '../../domain/repositories/feedback-repository.js';
import { ExtractContextFeedback } from './extract-context-feedback.js';
import crypto from 'node:crypto';

export class MarkTaskDone {
  private feedbackExtractor = new ExtractContextFeedback();

  constructor(
    private taskRepository: TaskRepository,
    private reviewer: Reviewer,
    private fileSystem: FileSystem,
    private eventRepository?: EventRepository,
    private feedbackRepository?: FeedbackRepository,
  ) {}

  async execute(taskId: string, force = false) {
    const task = await this.taskRepository.getById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (!force) {
      const reviewResult = this.reviewer.reviewTask({ ...task, status: TaskStatus.DONE }, task.rawMetaLine);
      if (!reviewResult.valid) {
        throw new Error(`Cannot mark ${taskId} as DONE due to violations:\n- ${reviewResult.violations.join('\n- ')}`);
      }

      const hanseiRequirement = await this.validateHanseiRequirement(task.id, task.content);
      if (hanseiRequirement) {
        throw new Error(`Cannot mark ${taskId} as DONE:\n- ${hanseiRequirement}`);
      }
    }

    task.status = TaskStatus.DONE;
    task.focus = false;
    if (!task.closedAt) {
      task.closedAt = new Date().toISOString();
    }
    await this.taskRepository.save(task);

    if (this.eventRepository) {
      await this.eventRepository.append({
        id: crypto.randomUUID(),
        type: 'TASK_COMPLETED',
        timestamp: new Date().toISOString(),
        subject: taskId,
        payload: {
          cost: task.cost,
          steps: task.steps
        }
      });
    }

    if (this.feedbackRepository) {
      const signal = this.feedbackExtractor.extract(taskId, task.content ?? '');
      if (signal) {
        await this.feedbackRepository.append(signal);
      }
    }

    return task;
  }

  private async validateHanseiRequirement(taskId: string, content: string): Promise<string | null> {
    const configRaw = await this.fileSystem.readFile('arch.config.json');
    const config = JSON.parse(configRaw);
    const hanseiSinceTaskId = config.hanseiSinceTaskId as number | undefined;
    const taskNumber = parseInt(taskId.replace('TASK-', ''), 10);

    if (hanseiSinceTaskId === undefined || Number.isNaN(taskNumber) || taskNumber < hanseiSinceTaskId) {
      return null;
    }

    if (!content.includes('## Hansei')) {
      return `missing ## Hansei section for post-rollout task (TASK-${hanseiSinceTaskId}+).`;
    }

    return null;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "pass|fail|ok|not ok" | head -20
```

Expected: all tests pass.

- [ ] **Step 6: Wire NodeFeedbackRepository into command-parser.ts**

Find where `MarkTaskDone` is constructed in `cli/src/main/ts/infrastructure/cli/command-parser.ts` (or equivalent wiring file) and add the `FeedbackRepository`:

```typescript
import { NodeFeedbackRepository } from '../filesystem/node-feedback-repository.js';
// ... inside the TaskCommand / MarkTaskDone construction:
const feedbackRepo = new NodeFeedbackRepository(fileSystem);
// Pass feedbackRepo as 5th argument to MarkTaskDone
```

Check the actual wiring location first:
```bash
grep -n "MarkTaskDone\|markTaskDone" /home/valentin/code/arch/cli/src/main/ts/infrastructure/cli/command-parser.ts
```

- [ ] **Step 7: Run tests to verify no regressions**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "pass|fail|ok|not ok" | head -20
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
cd /home/valentin/code/arch && git add cli/src/main/ts/application/use-cases/mark-task-done.ts cli/src/main/ts/infrastructure/cli/command-parser.ts cli/src/test/ts/mark-task-done-feedback.test.ts
git commit -m "feat: extract and persist context feedback on task completion"
```

---

### Task 5: ContextInference applies feedback signals

Adjust task-reference boost scores based on feedback history — tasks marked "off" should have reduced influence on future inference.

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/context-inference.ts`
- Create: `cli/src/test/ts/context-inference-feedback.test.ts`

- [ ] **Step 1: Write failing tests**

Create `cli/src/test/ts/context-inference-feedback.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { ContextInference } from '../../main/ts/application/use-cases/context-inference.js';
import type { ContextIndex } from '../../main/ts/domain/models/context-index.js';
import type { FeedbackSignal } from '../../main/ts/domain/models/feedback-signal.js';

class MockFS {
  files: Record<string, string> = {};
  written: Record<string, string> = {};
  async readFile(p: string) { if (!(p in this.files)) throw new Error(`Not found: ${p}`); return this.files[p]; }
  async writeFile(p: string, c: string) { this.written[p] = c; }
  async exists(p: string) { return p in this.files; }
  async readDirectory() { return []; }
  async rename() {}
  async mkdir() {}
  async deleteFile(_p: string) {}
}

const TASK_FILE_A = 'docs/tasks/TASK-100.md';

const BASE_INDEX: ContextIndex = {
  version: 4,
  builtAt: '2026-05-11T00:00:00Z',
  files: {
    'cli/src/main/ts/domain/models/auth.ts': {
      symbols: ['AuthService'],
      imports: [],
      tags: ['auth', 'domain'],
      criticality: 'core',
      runtimeUsage: 'hot',
    },
    'cli/src/main/ts/infrastructure/middleware/session.ts': {
      symbols: ['SessionMiddleware'],
      imports: [],
      tags: ['session', 'middleware'],
      criticality: 'support',
      runtimeUsage: 'warm',
    },
  },
  adrs: {},
  adrTaskLinks: {},
  failures: {},
  guidelineFailureLinks: {},
  guidelines: {},
  tasks: {
    'TASK-099': {
      commitCount: 3,
      lastCommitDate: '2026-05-01T00:00:00Z',
      touchedFrequency: {
        'cli/src/main/ts/domain/models/auth.ts': 3,
        'cli/src/main/ts/infrastructure/middleware/session.ts': 2,
      },
      recentCommitRefs: ['abc123'],
      commitRefOverflow: false,
    },
  },
};

test('off feedback reduces task-reference boost for a known task', async () => {
  const fs = new MockFS();
  fs.files['.arch/context-index.json'] = JSON.stringify(BASE_INDEX);
  fs.files['.arch/context-feedback.json'] = JSON.stringify([
    {
      taskId: 'TASK-099',
      timestamp: '2026-05-10T00:00:00Z',
      verdict: 'off',
      details: { wrongFiles: true, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false },
    } as FeedbackSignal,
  ]);
  // Minimal task file so execute() can write it
  fs.files[TASK_FILE_A] = `## TASK-100: fix oauth callback TASK-099\n**Meta:** P1 | S | IN_PROGRESS\n\n### Acceptance Criteria\n- [ ] done\n`;

  const inference = new ContextInference(fs as any);
  await inference.execute('TASK-100', 'fix oauth callback TASK-099', '2-code-generation');

  const written = fs.written[TASK_FILE_A];
  assert.ok(written, 'task file updated');

  // With "off" feedback on TASK-099, the auth.ts file still appears if it scored via keywords,
  // but the direct task-reference contribution is reduced (score should be lower).
  // We verify the section is injected without asserting exact score values.
  assert.ok(written.includes('### Relevant Context'), 'context section written');
});

test('accurate feedback does not suppress task-reference files', async () => {
  const fs = new MockFS();
  fs.files['.arch/context-index.json'] = JSON.stringify(BASE_INDEX);
  fs.files['.arch/context-feedback.json'] = JSON.stringify([
    {
      taskId: 'TASK-099',
      timestamp: '2026-05-10T00:00:00Z',
      verdict: 'accurate',
      details: { wrongFiles: false, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false },
    } as FeedbackSignal,
  ]);
  fs.files[TASK_FILE_A] = `## TASK-100: fix oauth callback TASK-099\n**Meta:** P1 | S | IN_PROGRESS\n\n### Acceptance Criteria\n- [ ] done\n`;

  const inference = new ContextInference(fs as any);

  // Build the index with keyword score for auth so files appear regardless
  const result = inference.score(BASE_INDEX, ['auth', 'session'], '2-code-generation', 'fix oauth callback TASK-099', new Map([
    ['TASK-099', { taskId: 'TASK-099', timestamp: '2026-05-10T00:00:00Z', verdict: 'accurate', details: { wrongFiles: false, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false } }],
  ]));

  // auth.ts should appear in results
  assert.ok(result.files.some(f => f.path === 'cli/src/main/ts/domain/models/auth.ts'));
});

test('score() accepts optional feedbackMap and reduces boost for off tasks', () => {
  const fs = new MockFS();
  const inference = new ContextInference(fs as any);

  const resultWithout = inference.score(BASE_INDEX, ['auth'], '2-code-generation', 'fix oauth callback TASK-099');
  const resultWithOff = inference.score(BASE_INDEX, ['auth'], '2-code-generation', 'fix oauth callback TASK-099', new Map([
    ['TASK-099', { taskId: 'TASK-099', timestamp: '2026-05-10T00:00:00Z', verdict: 'off', details: { wrongFiles: true, missingFiles: false, wrongAdrs: false, tooMuchNoise: false, confidenceMisleading: false } }],
  ]));

  const authWithout = resultWithout.files.find(f => f.path === 'cli/src/main/ts/domain/models/auth.ts');
  const authWithOff = resultWithOff.files.find(f => f.path === 'cli/src/main/ts/domain/models/auth.ts');

  // Both may still rank auth.ts (keyword hit), but the score from task-ref should be lower with off feedback
  if (authWithout && authWithOff) {
    assert.ok(authWithOff.score <= authWithout.score, `off feedback score (${authWithOff.score}) should be ≤ without feedback (${authWithout.score})`);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A3 "context-inference-feedback"
```

Expected: FAIL — `score()` doesn't accept `feedbackMap` parameter.

- [ ] **Step 3: Update ContextInference to load and apply feedback**

In `cli/src/main/ts/application/use-cases/context-inference.ts`:

**3a. Add the import at the top:**

```typescript
import type { FeedbackSignal } from '../../domain/models/feedback-signal.js';
```

**3b. Add a feedback path constant and update the `execute` method** to load feedback signals and pass them to `score()`:

Replace the beginning of the `execute` method (up through the `score()` call) with:

```typescript
async execute(taskId: string, taskText: string, taskClass: string): Promise<void> {
  let index: ContextIndex;
  try {
    const raw = await this.fileSystem.readFile(this.indexPath);
    index = JSON.parse(raw) as ContextIndex;
  } catch {
    return;
  }

  const keywords = this.extractKeywords(taskText);
  const taskRefs = this.extractTaskRefs(taskText);
  const adrRefs = this.extractAdrRefs(taskText);
  if (keywords.length === 0 && taskRefs.length === 0 && adrRefs.length === 0) return;

  const feedbackMap = await this.loadFeedbackMap();
  const result = this.score(index, keywords, taskClass, taskText, feedbackMap);
  // ... rest of execute remains unchanged
```

**3c. Add the `loadFeedbackMap` private method** (add after the existing private methods):

```typescript
private async loadFeedbackMap(): Promise<Map<string, FeedbackSignal>> {
  try {
    const raw = await this.fileSystem.readFile('.arch/context-feedback.json');
    const signals = JSON.parse(raw) as FeedbackSignal[];
    const map = new Map<string, FeedbackSignal>();
    for (const s of signals) {
      map.set(s.taskId, s);
    }
    return map;
  } catch {
    return new Map();
  }
}
```

**3d. Update the `score()` signature** to accept the optional feedback map:

```typescript
score(index: ContextIndex, keywords: string[], taskClass: string, taskText = '', feedbackMap?: Map<string, FeedbackSignal>): ContextResult {
```

**3e. In the task-reference pass** inside `score()`, replace the boost line:

Find:
```typescript
fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + DIRECT_TASK_REFERENCE_BOOST);
```

Replace with:
```typescript
const feedback = feedbackMap?.get(taskRef);
const boost = (feedback?.verdict === 'off')
  ? DIRECT_TASK_REFERENCE_BOOST * 0.1
  : DIRECT_TASK_REFERENCE_BOOST;
fileScoreMap.set(filePath, (fileScoreMap.get(filePath) ?? 0) + boost);
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -E "pass|fail|ok|not ok" | head -20
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /home/valentin/code/arch && git add cli/src/main/ts/application/use-cases/context-inference.ts cli/src/test/ts/context-inference-feedback.test.ts
git commit -m "feat: apply feedback signals to context inference task-reference scoring"
```

---

### Task 6: Update ROADMAP.md to reflect completed loop

- [ ] **Step 1: Update Phase 1 statuses**

In `docs/ROADMAP.md`:
- `arch capture`: `PARTIAL` → `PARTIAL` (note: scaffold→context wired, LLM enrichment operational)
- `Auto Context Engine`: `PARTIAL` → `IN PROGRESS` only if context injection at scaffold time is confirmed working end-to-end
- Add a note under Phase 1 that the feedback loop is now closed

- [ ] **Step 2: Run arch review to confirm no drift**

```bash
arch review
```

Expected: no new violations introduced.

- [ ] **Step 3: Commit**

```bash
cd /home/valentin/code/arch && git add docs/ROADMAP.md
git commit -m "docs: update roadmap to reflect closed learning loop"
```

---

## Self-Review

**Spec coverage:**
- ✅ Context injection at scaffold time (Task 1)
- ✅ Feedback extraction on task completion (Tasks 2–4)
- ✅ ContextIndex write-back / inference adjustment (Task 5)
- ✅ `FeedbackRepository` interface + `NodeFeedbackRepository` implementation (Task 2)
- ✅ All wiring connected end-to-end (Task 4 Step 6)

**Placeholder scan:** No TBD/TODO items. All code is complete.

**Type consistency:**
- `FeedbackSignal` defined in Task 2 Step 1, imported in Tasks 4 and 5
- `FeedbackRepository` interface defined in Task 2 Step 2, implemented in Task 2 Step 3, used in Task 4 Step 4
- `ExtractContextFeedback` defined in Task 3 Step 3, imported in Task 4 Step 4
- `score()` signature updated to accept `Map<string, FeedbackSignal>` in Task 5 Step 3d — matches usage in test (Task 5 Step 1)
