# THINK Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split THINK into a cheap structural default loop and an expensive `--deep` mode; cut vague discretionary synthesis; add lightweight trusted-metrics auto-refresh.

**Architecture:** TASK-255 rewrites `THINK.md` and teaches `reflect-command.ts` to inject a mode marker (`<!-- MODE: DEFAULT -->` / `<!-- MODE: DEEP -->`), so the LLM executing THINK knows which phases to run. A new `DeepAnalysisState` file tracks cadence. TASK-256 is a protocol-only edit to THINK.md Phase 3. TASK-257 extracts a `LightweightMetricsRefresh` use case called from `mark-task-done.ts` and `govern-system.ts`, surgically updating only the Trusted section of `METRICS.md`.

**Tech Stack:** TypeScript (Node 22), `node:test`, `node:fs`, existing `FileSystem`/`GitRepository` domain interfaces.

**Sequencing:** TASK-255 and TASK-257 are independent — run in parallel. TASK-256 depends on TASK-255 (both edit `THINK.md`).

---

## TASK-255: Split THINK into default loop and --deep mode

### T255-1: Rewrite THINK.md with mode sections

**Files:**
- Modify: `docs/agents/THINK.md`

- [ ] **Replace the current THINK.md header** with a mode-aware header that tells the executing agent which phases to run:

```markdown
# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->
<!-- MODE INSTRUCTION: check the first line of this prompt for <!-- MODE: DEFAULT --> or <!-- MODE: DEEP -->. -->
<!-- DEFAULT MODE: execute Phase 1 and Phase 2 execution steps only (steps marked [DEFAULT]). -->
<!-- DEEP MODE: execute all phases. -->
```

- [ ] **Mark each phase header** with its mode tag. Change:
  - `## Phase 1:` → `## Phase 1 [DEFAULT]: Context & Replenishment (Conductor)`
  - `## Phase 2:` → `## Phase 2 [DEFAULT/DEEP split]: Idea Refinement (Refine)`
  - Inside Phase 2: add a note before step 3 DRAFT evaluation: `> **[DEEP only]** The following sub-step (DRAFT evaluation, up to 3 per session) runs only in DEEP mode. In DEFAULT mode, skip directly to the Phase boundary.`
  - `## Phase 2.5:` → `## Phase 2.5 [DEEP]: Semantic Drift Analysis (Observer)`
  - `## Phase 3:` → `## Phase 3 [DEEP]: Continuous Kaizen (Real-time Reviewer)`

- [ ] **Commit:**
```bash
git add docs/agents/THINK.md
git commit -m "docs: [TASK-255] THINK.md — add mode markers for DEFAULT/DEEP split"
```

### T255-2: Normalize weak-signal adjudication dates

**Files:**
- Modify: `docs/tensions/weak-signals.md`

- [ ] **Read each active (non-promoted, non-demoted) signal.** Current active signals:
  - `2026-05-12 — governance naming surface`: `after 6 THINK reviews (extended once — 2026-05-15)`
  - `2026-05-12 — constraint axis drift`: `after 6 THINK reviews (extended once — 2026-05-15)`

  Both are count-based. Per TASK-255 decision: normalize to ISO YYYY-MM-DD or the implementation will emit a warning and skip. Estimate 6 THINK reviews ≈ 6 weeks from 2026-05-15 → target `2026-06-26`.

- [ ] **Update each active signal's `Adjudicate by:` line** to include an ISO date alongside the original text:

  Change:
  ```
  **Adjudicate by:** after 6 THINK reviews (extended once — 2026-05-15)
  ```
  To:
  ```
  **Adjudicate by:** 2026-06-26 (after 6 THINK reviews, extended once 2026-05-15)
  ```

- [ ] **Commit:**
```bash
git add docs/tensions/weak-signals.md
git commit -m "docs: [TASK-255] normalize weak-signal adjudication dates to ISO YYYY-MM-DD"
```

### T255-3: Add DeepAnalysisState type and read/write helpers

**Files:**
- Create: `cli/src/main/ts/application/use-cases/deep-analysis-state.ts`
- Create: `cli/src/test/ts/deep-analysis-state.test.ts`

- [ ] **Write the failing test** in `cli/src/test/ts/deep-analysis-state.test.ts`:

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { DeepAnalysisState, readDeepAnalysisState, writeDeepAnalysisState, isDeepAnalysisDue } from '../../main/ts/application/use-cases/deep-analysis-state.js';
import { MockFileSystem } from './mocks/index.js';

test('readDeepAnalysisState returns null when file missing', async () => {
  const fs = new MockFileSystem({});
  const state = await readDeepAnalysisState(fs);
  assert.strictEqual(state, null);
});

test('writeDeepAnalysisState persists and readDeepAnalysisState retrieves', async () => {
  const fs = new MockFileSystem({});
  const state: DeepAnalysisState = { lastDeepRunTick: 3, lastDeepRunTimestamp: '2026-05-15T10:00:00.000Z' };
  await writeDeepAnalysisState(fs, state);
  const retrieved = await readDeepAnalysisState(fs);
  assert.deepStrictEqual(retrieved, state);
});

test('isDeepAnalysisDue returns true when ticks elapsed >= cadenceN', () => {
  assert.strictEqual(isDeepAnalysisDue({ lastDeepRunTick: 1 }, 6, 5), true);  // 6-1=5 >= 5
  assert.strictEqual(isDeepAnalysisDue({ lastDeepRunTick: 2 }, 6, 5), false); // 6-2=4 < 5
});

test('isDeepAnalysisDue returns true when state is null', () => {
  assert.strictEqual(isDeepAnalysisDue(null, 6, 5), true);
});
```

- [ ] **Run test to verify it fails:**
```bash
npm test --prefix cli 2>&1 | grep "deep-analysis-state"
```
Expected: module not found or import error.

- [ ] **Implement** `cli/src/main/ts/application/use-cases/deep-analysis-state.ts`:

```typescript
import { FileSystem } from '../../domain/repositories/file-system.js';

export interface DeepAnalysisState {
  lastDeepRunTick: number;
  lastDeepRunTimestamp: string;
}

const STATE_PATH = '.arch/deep-analysis-state.json';

export async function readDeepAnalysisState(fs: FileSystem): Promise<DeepAnalysisState | null> {
  try {
    const content = await fs.readFile(STATE_PATH);
    return JSON.parse(content) as DeepAnalysisState;
  } catch {
    return null;
  }
}

export async function writeDeepAnalysisState(fs: FileSystem, state: DeepAnalysisState): Promise<void> {
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

export function isDeepAnalysisDue(state: DeepAnalysisState | null, currentTick: number, cadenceN: number): boolean {
  if (!state) return true;
  return (currentTick - state.lastDeepRunTick) >= cadenceN;
}
```

- [ ] **Run tests to verify they pass:**
```bash
npm test --prefix cli 2>&1 | grep -A3 "deep-analysis-state"
```
Expected: all 4 tests pass.

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/deep-analysis-state.ts cli/src/test/ts/deep-analysis-state.test.ts
git commit -m "feat: [TASK-255] DeepAnalysisState — read/write/due helpers"
```

### T255-4: Add weak-signal date parser

**Files:**
- Create: `cli/src/main/ts/application/use-cases/weak-signal-checker.ts`
- Create: `cli/src/test/ts/weak-signal-checker.test.ts`

- [ ] **Write the failing test:**

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { hasOverdueWeakSignal, parseAdjudicationDate } from '../../main/ts/application/use-cases/weak-signal-checker.js';

test('parseAdjudicationDate extracts ISO date from Adjudicate by line', () => {
  assert.strictEqual(
    parseAdjudicationDate('**Adjudicate by:** 2026-06-26 (after 6 THINK reviews)'),
    '2026-06-26'
  );
});

test('parseAdjudicationDate returns null for non-ISO format', () => {
  assert.strictEqual(
    parseAdjudicationDate('**Adjudicate by:** after 6 THINK reviews'),
    null
  );
});

test('parseAdjudicationDate ignores promoted/demoted signals', () => {
  assert.strictEqual(
    parseAdjudicationDate('**Adjudicate by:** after 3 THINK reviews — PROMOTED 2026-05-15'),
    null
  );
});

test('hasOverdueWeakSignal returns false and warns when no ISO dates found', () => {
  const warnings: string[] = [];
  const content = '**Adjudicate by:** after 6 THINK reviews\n**Adjudicate by:** after 3 THINK reviews';
  const result = hasOverdueWeakSignal(content, new Date('2026-05-15'), warnings);
  assert.strictEqual(result, false);
  assert.ok(warnings.length > 0);
  assert.ok(warnings[0].includes('no ISO date'));
});

test('hasOverdueWeakSignal returns true when a date is past today', () => {
  const warnings: string[] = [];
  const content = '**Adjudicate by:** 2026-01-01 (past deadline)';
  const result = hasOverdueWeakSignal(content, new Date('2026-05-15'), warnings);
  assert.strictEqual(result, true);
  assert.strictEqual(warnings.length, 0);
});

test('hasOverdueWeakSignal returns false when all dates are future', () => {
  const warnings: string[] = [];
  const content = '**Adjudicate by:** 2027-01-01 (future)';
  const result = hasOverdueWeakSignal(content, new Date('2026-05-15'), warnings);
  assert.strictEqual(result, false);
});
```

- [ ] **Run to verify failure:**
```bash
npm test --prefix cli 2>&1 | grep "weak-signal-checker"
```

- [ ] **Implement** `cli/src/main/ts/application/use-cases/weak-signal-checker.ts`:

```typescript
const ISO_DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;
const PROMOTED_DEMOTED_RE = /—\s*(PROMOTED|DEMOTED)\s+\d{4}-\d{2}-\d{2}/i;

export function parseAdjudicationDate(line: string): string | null {
  if (PROMOTED_DEMOTED_RE.test(line)) return null;
  const match = line.match(ISO_DATE_RE);
  return match ? match[1] : null;
}

export function hasOverdueWeakSignal(content: string, today: Date, warnings: string[]): boolean {
  const adjLines = content
    .split('\n')
    .filter(l => l.includes('**Adjudicate by:**'));

  const activeDates = adjLines
    .map(l => parseAdjudicationDate(l))
    .filter((d): d is string => d !== null);

  if (activeDates.length === 0 && adjLines.length > 0) {
    warnings.push(`[WEAK-SIGNAL] no ISO date found in ${adjLines.length} Adjudicate by entries — skipping immediate trigger (fail-closed)`);
    return false;
  }

  const todayStr = today.toISOString().slice(0, 10);
  return activeDates.some(d => d <= todayStr);
}
```

- [ ] **Run tests to verify they pass:**
```bash
npm test --prefix cli 2>&1 | grep -A3 "weak-signal-checker"
```

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/weak-signal-checker.ts cli/src/test/ts/weak-signal-checker.test.ts
git commit -m "feat: [TASK-255] weak-signal date parser with fail-closed skip"
```

### T255-5: Update arch.config.json with deepCadenceN

**Files:**
- Modify: `arch.config.json`

- [ ] **Add `deepCadenceN` to the `reflect` block** in `arch.config.json`. Current reflect block:
```json
"reflect": {
  "thresholds": {
    "minEngagementRate": 0.5,
    "maxUnobservedWithProposalRate": 0.3,
    "persistenceN": 3
  }
}
```
Change to:
```json
"reflect": {
  "deepCadenceN": 5,
  "thresholds": {
    "minEngagementRate": 0.5,
    "maxUnobservedWithProposalRate": 0.3,
    "persistenceN": 3
  }
}
```

- [ ] **Commit:**
```bash
git add arch.config.json
git commit -m "chore: [TASK-255] add reflect.deepCadenceN=5 to arch.config.json"
```

### T255-6: Surface "deep analysis due" in govern-system.ts

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/govern-system.ts`
- Modify: `cli/src/test/ts/govern-system.test.ts`

- [ ] **Write the failing test** — add to `govern-system.test.ts`:

```typescript
test('govern surfaces deep analysis due when cadence threshold reached', async () => {
  // Set up: lastDeepRunTick=1, currentTick=6, cadenceN=5 → due
  // Verify console output includes "deep analysis due (run arch reflect --deep)"
  // This test uses a mock FileSystem seeded with .arch/deep-analysis-state.json
  // containing { lastDeepRunTick: 1, lastDeepRunTimestamp: '2026-05-01T00:00:00Z' }
  // and a govern tick that reaches tick 6.
  // Check: govern output includes the deep analysis message.
  // Implementation detail: inspect captured stdout or the returned result object.
});
```

(Note: add to the existing govern-system test file. Follow the existing test pattern in that file for mock setup.)

- [ ] **Run to verify failure.**

- [ ] **Add deep cadence check to `govern-system.ts`** — in the `analyze()` method, after the existing `conductEveryN` check, add:

```typescript
// Deep analysis cadence check
const deepCadenceN = config.reflect?.deepCadenceN ?? 5;
const deepState = await readDeepAnalysisState(this.fileSystem);
const currentTick = await this.getCurrentTick(); // use existing tick method
const deepDue = isDeepAnalysisDue(deepState, currentTick, deepCadenceN);

// Immediate trigger: check weak signals
let weakSignalOverdue = false;
const weakSignalsPath = 'docs/tensions/weak-signals.md';
if (await this.fileSystem.exists(weakSignalsPath)) {
  const content = await this.fileSystem.readFile(weakSignalsPath);
  const warnings: string[] = [];
  weakSignalOverdue = hasOverdueWeakSignal(content, new Date(), warnings);
  warnings.forEach(w => console.log(`  ${w}`));
}

if (deepDue || weakSignalOverdue) {
  const reason = weakSignalOverdue ? 'weak signal past adjudication deadline' : `${currentTick - (deepState?.lastDeepRunTick ?? 0)} ticks since last deep run`;
  console.log(`  Deep analysis due (${reason}) — run arch reflect --deep`);
  analysisReasons.push('deep-analysis-due');
}
```

Add imports at top of `govern-system.ts`:
```typescript
import { readDeepAnalysisState, isDeepAnalysisDue } from './deep-analysis-state.js';
import { hasOverdueWeakSignal } from './weak-signal-checker.js';
```

Also add `getCurrentTick()` private method if not present (reads `lastCommittedGovernTick` from the focus ledger, or returns 0 if absent):
```typescript
private async getCurrentTick(): Promise<number> {
  try {
    const ledgerPath = '.arch/focus-ledger.jsonl';
    if (!(await this.fileSystem.exists(ledgerPath))) return 0;
    const content = await this.fileSystem.readFile(ledgerPath);
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return 0;
    const last = JSON.parse(lines[lines.length - 1]);
    return last.tick ?? 0;
  } catch {
    return 0;
  }
}
```

- [ ] **Run tests to verify they pass:**
```bash
npm test --prefix cli; exit: 0
```

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/govern-system.ts cli/src/test/ts/govern-system.test.ts
git commit -m "feat: [TASK-255] govern surfaces deep analysis due at cadence threshold"
```

### T255-7: Add --deep flag to reflect-command.ts

**Files:**
- Modify: `cli/src/main/ts/application/commands/reflect-command.ts`

- [ ] **Add `--deep` flag parsing and mode-injected prompt** to `reflect-command.ts`:

Replace the `execute` method to handle `--deep`:

```typescript
async execute(args: string[]): Promise<void> {
  const deepMode = args.includes('--deep');
  const sub = args.filter(a => a !== '--deep')[0];

  if (!sub || sub === 'run') {
    await this.runAnalysis(deepMode);
    return;
  }

  if (sub === 'influence') {
    // ... existing influence code unchanged ...
    return;
  }

  console.log([
    'Usage: arch reflect [--deep] [subcommand]',
    '',
    'Flags:',
    '  --deep      Run full analysis including Phase 2.5 and Phase 3 (cadence-gated)',
    '',
    'Subcommands:',
    '  (none)      Run THINK analysis (DEFAULT mode: Phase 1 + Phase 2 execution only)',
    '  run         Same as no subcommand',
    '  influence   Epistemic influence report',
  ].join('\n'));
}
```

Update `runAnalysis` to accept and use `deepMode`:

```typescript
private async runAnalysis(deepMode: boolean): Promise<void> {
  const promptFile = 'docs/agents/THINK.md';
  const modeLabel = deepMode ? 'DEEP' : 'DEFAULT';
  const modePreamble = `<!-- MODE: ${modeLabel} -->\n`;

  console.log(`  ARCH — arch reflect [${modeLabel.toLowerCase()} mode]`);
  if (deepMode) {
    console.log('  Running all phases including Phase 2.5 (semantic drift) and Phase 3 (kaizen)');
  } else {
    console.log('  Running structural phases only: Phase 1 (replenishment) + Phase 2 (promotions/TTL)');
  }
  console.log('  Authority: proposals only — never mutates task state, never satisfies policy gates');

  try {
    const config = JSON.parse(fs.readFileSync('arch.config.json', 'utf8'));
    const thinkContent = fs.readFileSync(promptFile, 'utf8');
    const prompt = modePreamble + thinkContent;

    // Write to a temp file so CLI templates using $(cat file) work correctly
    const tmpPath = `.arch/.think-prompt-${Date.now()}.md`;
    fs.writeFileSync(tmpPath, prompt);

    const clis = config.clis || [];
    try {
      for (const cli of clis) {
        const which = spawnSync('which', [cli.bin]);
        if (which.status !== 0) continue;

        const cmd = cli.template.replace(/\{prompt\}/g, `$(cat ${tmpPath})`);
        const result = spawnSync('sh', ['-c', cmd], { stdio: 'inherit' });

        if (deepMode) {
          // Update deep analysis state after successful deep run
          await this.updateDeepState();
        }

        process.exit(result.status ?? 0);
      }
    } finally {
      try { fs.unlinkSync(tmpPath); } catch {}
    }

    console.log('  Note: No AI CLI detected. Showing THINK protocol:');
    console.log(prompt);
    process.exit(1);
  } catch (e: any) {
    console.error('Error in arch reflect:', e.message);
    process.exit(1);
  }
}

private async updateDeepState(): Promise<void> {
  try {
    const tick = await this.getCurrentTick();
    await writeDeepAnalysisState(this.fileSystem, {
      lastDeepRunTick: tick,
      lastDeepRunTimestamp: new Date().toISOString(),
    });
  } catch {
    // non-fatal
  }
}

private async getCurrentTick(): Promise<number> {
  try {
    const ledgerPath = `${this.rootPath}/.arch/focus-ledger.jsonl`;
    const content = fs.readFileSync(ledgerPath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    if (lines.length === 0) return 0;
    const last = JSON.parse(lines[lines.length - 1]);
    return last.tick ?? 0;
  } catch {
    return 0;
  }
}
```

Add imports at top of `reflect-command.ts`:
```typescript
import { writeDeepAnalysisState } from '../use-cases/deep-analysis-state.js';
```

- [ ] **Build to verify compilation:**
```bash
npm run build --prefix cli 2>&1 | tail -5
```
Expected: `ESM ⚡️ Build success`

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/commands/reflect-command.ts
git commit -m "feat: [TASK-255] reflect-command --deep flag with mode preamble injection"
```

### T255-8: Final verification

- [ ] **Run full test suite:**
```bash
npm test --prefix cli; exit: 0
```

- [ ] **Run arch review:**
```bash
bash scripts/arch.sh review
```
Expected: all 20 checks pass (large-diff warning acceptable if uncommitted files present).

- [ ] **Mark TASK-255 ACs done, update meta to REVIEW, write Hansei, commit.**

---

## TASK-256: Cut Phase 3 "Immediate Improvements", add Kaizen evidence gate

*(Start only after TASK-255 is at REVIEW or DONE)*

### T256-1: Remove Immediate Improvements step from THINK.md Phase 3

**Files:**
- Modify: `docs/agents/THINK.md`

- [ ] **In THINK.md Phase 3**, remove the numbered step "3. Immediate Improvements: Identify context gaps or guideline changes based on patterns observed across phases." entirely.

- [ ] **Add evidence gate to Phase 3 step 1 (Kaizen Learning)** — append to the step:

  ```markdown
  **Evidence gate:** Only emit a `[KAIZEN]` proposal if it can cite a concrete repeated signal from at least one of: (a) a Phase 1 violation or blocker found this session, (b) a Phase 2 IDEA triage finding, (c) a Phase 2.5 `[SEMANTIC-DRIFT]` or `[TENSION-DECAY]` emission, or (d) a metric from `docs/METRICS.md` that exceeds its threshold. A proposal without a named source signal is suppressed — do not emit it.
  ```

- [ ] **Renumber Phase 3 steps** so they are sequential with no gap from the removed step.

- [ ] **Commit:**
```bash
git add docs/agents/THINK.md
git commit -m "docs: [TASK-256] remove Phase 3 Immediate Improvements, add Kaizen evidence gate"
```

### T256-2: Verify and close

- [ ] **Run arch review:**
```bash
bash scripts/arch.sh review
```

- [ ] **Mark TASK-256 ACs done, update meta to REVIEW, write Hansei, commit.**

---

## TASK-257: Lightweight trusted-metrics refresh

### T257-1: Create LightweightMetricsRefresh use case

**Files:**
- Create: `cli/src/main/ts/application/use-cases/lightweight-metrics-refresh.ts`
- Create: `cli/src/test/ts/lightweight-metrics-refresh.test.ts`

- [ ] **Write the failing test:**

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { LightweightMetricsRefresh } from '../../main/ts/application/use-cases/lightweight-metrics-refresh.js';
import { MockFileSystem } from './mocks/index.js';

const METRICS_WITH_ALL_SECTIONS = `# ARCH Metrics

<!-- GENERATED:START -->
## Operational Metrics

*Last updated: 2026-05-01T00:00:00.000Z*

### Trusted Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| **Completed Tasks** | 100 | total archived |
| **REVIEW_FAIL Rate** | 0.0% | rejected / total review exits |

### Cycle Time (P50/P90)

| Size | P50 | P90 | Count |
|------|-----|-----|-------|
| XS | 0.7h | 22.7h | 55 |

### Experimental Metrics

> Confidence is below the threshold required for canonical use. Do not use for decisions.

| Metric | Value | Notes |
|--------|-------|-------|
| **Integrity Level** | LOW | CONFIDENCE: 0% — calibration insufficient |
| **Avg Cost / Task** | $0.13 | token-estimate heuristic v1 |

> **Epistemic Digest:** \`metrics-engine-v4\` (Range: \`HEAD~100..HEAD\`)

<!-- GENERATED:END -->
`;

test('refresh updates Trusted section row values', async () => {
  const fs = new MockFileSystem({ 'docs/METRICS.md': METRICS_WITH_ALL_SECTIONS });
  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 105, reviewFailRate: 0.02 });

  const updated = await fs.readFile('docs/METRICS.md');
  assert.ok(updated.includes('| **Completed Tasks** | 105 |'));
  assert.ok(updated.includes('| **REVIEW_FAIL Rate** | 2.0% |'));
});

test('refresh preserves Cycle Time section unchanged', async () => {
  const fs = new MockFileSystem({ 'docs/METRICS.md': METRICS_WITH_ALL_SECTIONS });
  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 105, reviewFailRate: 0.02 });

  const updated = await fs.readFile('docs/METRICS.md');
  assert.ok(updated.includes('| XS | 0.7h | 22.7h | 55 |'));
});

test('refresh preserves Experimental Metrics section unchanged', async () => {
  const fs = new MockFileSystem({ 'docs/METRICS.md': METRICS_WITH_ALL_SECTIONS });
  const refresh = new LightweightMetricsRefresh(fs);
  await refresh.execute({ completedTasks: 105, reviewFailRate: 0.02 });

  const updated = await fs.readFile('docs/METRICS.md');
  assert.ok(updated.includes('| **Integrity Level** | LOW |'));
  assert.ok(updated.includes('**Epistemic Digest:**'));
});

test('refresh updates Last updated timestamp', async () => {
  const fs = new MockFileSystem({ 'docs/METRICS.md': METRICS_WITH_ALL_SECTIONS });
  const refresh = new LightweightMetricsRefresh(fs);
  const before = new Date('2026-05-01T00:00:00Z');
  await refresh.execute({ completedTasks: 105, reviewFailRate: 0.02 });

  const updated = await fs.readFile('docs/METRICS.md');
  assert.ok(!updated.includes('2026-05-01T00:00:00.000Z')); // timestamp replaced
});

test('refresh is non-fatal when METRICS.md is missing', async () => {
  const fs = new MockFileSystem({});
  const refresh = new LightweightMetricsRefresh(fs);
  await assert.doesNotReject(() => refresh.execute({ completedTasks: 5, reviewFailRate: 0 }));
});
```

- [ ] **Run to verify failure.**

- [ ] **Implement** `cli/src/main/ts/application/use-cases/lightweight-metrics-refresh.ts`:

```typescript
import { FileSystem } from '../../domain/repositories/file-system.js';

export interface TrustedMetrics {
  completedTasks: number;
  reviewFailRate: number | 'pending';
}

export class LightweightMetricsRefresh {
  private readonly METRICS_PATH = 'docs/METRICS.md';

  constructor(private fileSystem: FileSystem) {}

  async execute(metrics: TrustedMetrics): Promise<void> {
    try {
      const content = await this.fileSystem.readFile(this.METRICS_PATH);
      const updated = this.updateTrustedSection(content, metrics);
      await this.fileSystem.writeFile(this.METRICS_PATH, updated);
    } catch {
      // non-fatal — stale metrics are acceptable
    }
  }

  private updateTrustedSection(content: string, metrics: TrustedMetrics): string {
    const failRateStr = metrics.reviewFailRate === 'pending'
      ? 'pending (insufficient event history)'
      : (metrics.reviewFailRate * 100).toFixed(1) + '%';

    const ts = new Date().toISOString();

    // Replace timestamp
    let result = content.replace(
      /\*Last updated: [^\*]+\*/,
      `*Last updated: ${ts}*`
    );

    // Replace only the two rows in the Trusted Metrics table, leaving headers intact
    result = result.replace(
      /(\| \*\*Completed Tasks\*\* \|)[^\n]+(\n)/,
      `$1 ${metrics.completedTasks} | total archived |$2`
    );
    result = result.replace(
      /(\| \*\*REVIEW_FAIL Rate\*\* \|)[^\n]+(\n)/,
      `$1 ${failRateStr} | rejected / total review exits |$2`
    );

    return result;
  }
}
```

- [ ] **Run tests to verify they pass:**
```bash
npm test --prefix cli 2>&1 | grep -A5 "lightweight-metrics"
```

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/lightweight-metrics-refresh.ts cli/src/test/ts/lightweight-metrics-refresh.test.ts
git commit -m "feat: [TASK-257] LightweightMetricsRefresh — surgical Trusted section update"
```

### T257-2: Compute TrustedMetrics at closure and govern time

**Files:**
- Create: `cli/src/main/ts/application/use-cases/compute-trusted-metrics.ts`
- Create: `cli/src/test/ts/compute-trusted-metrics.test.ts`

- [ ] **Write the failing test:**

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { computeTrustedMetrics } from '../../main/ts/application/use-cases/compute-trusted-metrics.js';
import { MockFileSystem } from './mocks/index.js';

test('completedTasks counts files in docs/archive/', async () => {
  const fs = new MockFileSystem({
    'docs/archive/TASK-001.md': '## TASK-001',
    'docs/archive/TASK-002.md': '## TASK-002',
  });
  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.completedTasks, 2);
});

test('reviewFailRate returns pending when no EVENTS.md', async () => {
  const fs = new MockFileSystem({});
  const metrics = await computeTrustedMetrics(fs);
  assert.strictEqual(metrics.reviewFailRate, 'pending');
});

test('reviewFailRate computes ratio from EVENTS.md', async () => {
  const eventsContent = [
    '# Event Log',
    '## 2026-05-01T10:00:00Z',
    'TASK-001 | REVIEW -> DONE',
    '## 2026-05-02T10:00:00Z',
    'TASK-002 | REVIEW -> READY',
    '## 2026-05-03T10:00:00Z',
    'TASK-003 | REVIEW -> DONE',
  ].join('\n');
  const fs = new MockFileSystem({ 'docs/EVENTS.md': eventsContent });
  const metrics = await computeTrustedMetrics(fs);
  // 1 rejection out of 3 total = 0.333...
  assert.ok(Math.abs((metrics.reviewFailRate as number) - 1/3) < 0.001);
});
```

- [ ] **Run to verify failure.**

- [ ] **Implement** `cli/src/main/ts/application/use-cases/compute-trusted-metrics.ts`:

```typescript
import { FileSystem } from '../../domain/repositories/file-system.js';
import { TrustedMetrics } from './lightweight-metrics-refresh.js';

export async function computeTrustedMetrics(fileSystem: FileSystem): Promise<TrustedMetrics> {
  const completedTasks = await countArchivedTasks(fileSystem);
  const reviewFailRate = await computeReviewFailRate(fileSystem);
  return { completedTasks, reviewFailRate };
}

async function countArchivedTasks(fileSystem: FileSystem): Promise<number> {
  try {
    const files = await fileSystem.listFiles('docs/archive');
    return files.filter(f => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

async function computeReviewFailRate(fileSystem: FileSystem): Promise<number | 'pending'> {
  try {
    const content = await fileSystem.readFile('docs/EVENTS.md');
    let rejections = 0;
    let approvals = 0;
    for (const line of content.split('\n')) {
      if (line.includes('REVIEW -> READY')) rejections++;
      if (line.includes('REVIEW -> DONE')) approvals++;
    }
    const total = rejections + approvals;
    if (total === 0) return 'pending';
    return rejections / total;
  } catch {
    return 'pending';
  }
}
```

- [ ] **Run tests to verify they pass.**

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/compute-trusted-metrics.ts cli/src/test/ts/compute-trusted-metrics.test.ts
git commit -m "feat: [TASK-257] computeTrustedMetrics — archive count + REVIEW_FAIL rate"
```

### T257-3: Wire refresh into mark-task-done.ts

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/mark-task-done.ts`
- Modify: `cli/src/test/ts/mark-task-done.test.ts`

- [ ] **Write the failing test** — add to `mark-task-done.test.ts`:

```typescript
test('mark task done triggers lightweight metrics refresh', async () => {
  let refreshCalled = false;
  const mockRefresh = { execute: async () => { refreshCalled = true; } };
  
  const useCase = new MarkTaskDone(
    mockTaskRepo, mockReviewer, mockFs,
    undefined, undefined, undefined, undefined,
    mockRefresh  // new optional param
  );
  await useCase.execute('TASK-031');
  assert.ok(refreshCalled, 'lightweight refresh should be called after closure');
});

test('mark task done does not revert on refresh failure', async () => {
  const failingRefresh = { execute: async () => { throw new Error('refresh failed'); } };
  const useCase = new MarkTaskDone(
    mockTaskRepo, mockReviewer, mockFs,
    undefined, undefined, undefined, undefined,
    failingRefresh
  );
  // Should not throw even if refresh throws
  await assert.doesNotReject(() => useCase.execute('TASK-031'));
});
```

- [ ] **Run to verify failure.**

- [ ] **Add optional `metricsRefresh` parameter to `MarkTaskDone` constructor:**

```typescript
constructor(
  private taskRepository: TaskRepository,
  private reviewer: Reviewer,
  private fileSystem: FileSystem,
  private eventRepository?: EventRepository,
  private feedbackRepository?: FeedbackRepository,
  private causalSignalLog?: CausalSignalLog,
  private eventLogger?: EventLogger,
  private metricsRefresh?: { execute: (m: TrustedMetrics) => Promise<void> }
) {}
```

- [ ] **At the end of `execute()` in `mark-task-done.ts`**, after `await this.taskRepository.save(task)` and all other side effects, add:

```typescript
// Lightweight metrics refresh — non-fatal
if (this.metricsRefresh) {
  try {
    const metrics = await computeTrustedMetrics(this.fileSystem);
    await this.metricsRefresh.execute(metrics);
  } catch {
    // non-fatal
  }
}
```

Add imports:
```typescript
import { computeTrustedMetrics } from './compute-trusted-metrics.js';
import { TrustedMetrics } from './lightweight-metrics-refresh.js';
```

- [ ] **Run tests to verify they pass:**
```bash
npm test --prefix cli; exit: 0
```

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/mark-task-done.ts cli/src/test/ts/mark-task-done.test.ts
git commit -m "feat: [TASK-257] wire lightweight metrics refresh into mark-task-done"
```

### T257-4: Wire refresh into govern-system.ts

**Files:**
- Modify: `cli/src/main/ts/application/use-cases/govern-system.ts`
- Modify: `cli/src/test/ts/govern-system.test.ts`

- [ ] **Write the failing test** — add to `govern-system.test.ts`:

```typescript
test('govern tick triggers lightweight metrics refresh', async () => {
  let refreshCalled = false;
  // Mock the LightweightMetricsRefresh in the govern system
  // Verify it is called on each tick
  // Follow existing test pattern in govern-system.test.ts for mock injection
});
```

- [ ] **In `govern-system.ts`**, at the end of the main `execute()` method (after the existing commit), add:

```typescript
// Lightweight metrics refresh — non-fatal
try {
  const metrics = await computeTrustedMetrics(this.fileSystem);
  const refresh = new LightweightMetricsRefresh(this.fileSystem);
  await refresh.execute(metrics);
} catch {
  // non-fatal
}
```

Add imports:
```typescript
import { computeTrustedMetrics } from './compute-trusted-metrics.js';
import { LightweightMetricsRefresh } from './lightweight-metrics-refresh.js';
```

- [ ] **Run tests:**
```bash
npm test --prefix cli; exit: 0
```

- [ ] **Commit:**
```bash
git add cli/src/main/ts/application/use-cases/govern-system.ts cli/src/test/ts/govern-system.test.ts
git commit -m "feat: [TASK-257] wire lightweight metrics refresh into govern-system tick"
```

### T257-5: Wire refresh into CLI entry point (mark-task-done command)

**Files:**
- Modify: `cli/src/main/ts/index.ts` (wherever `MarkTaskDone` is instantiated)

- [ ] **Find where `MarkTaskDone` is instantiated in `index.ts`** (grep: `new MarkTaskDone`). Add the `LightweightMetricsRefresh` as the last constructor argument:

```typescript
import { LightweightMetricsRefresh } from './application/use-cases/lightweight-metrics-refresh.js';
import { computeTrustedMetrics } from './application/use-cases/compute-trusted-metrics.js';

// Where MarkTaskDone is constructed:
const metricsRefresh = new LightweightMetricsRefresh(fileSystem);
const markTaskDone = new MarkTaskDone(
  taskRepository, reviewer, fileSystem,
  eventRepository, feedbackRepository, causalSignalLog, eventLogger,
  metricsRefresh
);
```

- [ ] **Build:**
```bash
npm run build --prefix cli 2>&1 | tail -5
```
Expected: `ESM ⚡️ Build success`

- [ ] **Commit:**
```bash
git add cli/src/main/ts/index.ts
git commit -m "feat: [TASK-257] wire LightweightMetricsRefresh into CLI entry point"
```

### T257-6: Final verification

- [ ] **Run full test suite:**
```bash
npm test --prefix cli; exit: 0
```

- [ ] **Run arch review:**
```bash
bash scripts/arch.sh review
```

- [ ] **Manual smoke test:** Close a task with `arch task done TASK-XXX` (dry run or real) and verify `docs/METRICS.md` Trusted section updates while Experimental section is preserved.

- [ ] **Mark TASK-257 ACs done, update meta to REVIEW, write Hansei, commit.**

---

## Self-Review

**Spec coverage check:**

| Requirement | Task | Covered? |
|-------------|------|----------|
| THINK.md has Default/Deep sections | T255-1 | ✓ |
| `--deep` flag on `arch reflect` | T255-7 | ✓ |
| `reflect.deepCadenceN` in arch.config.json | T255-5 | ✓ |
| `.arch/deep-analysis-state.json` created on `--deep` | T255-3, T255-7 | ✓ |
| Default mode skips Phase 2.5 and Phase 3 | T255-1, T255-7 | ✓ |
| Deep mode updates state file | T255-7 | ✓ |
| arch govern surfaces "deep analysis due" | T255-6 | ✓ |
| Immediate trigger on overdue weak signal | T255-4, T255-6 | ✓ |
| Weak signal ISO date normalization | T255-2 | ✓ |
| Fail-closed skip for non-ISO dates | T255-4 | ✓ |
| DRAFT cap (3/session) retained in --deep | T255-1 (protocol doc) | ✓ |
| Phase 3 Immediate Improvements removed | T256-1 | ✓ |
| Kaizen evidence gate added | T256-1 | ✓ |
| LightweightMetricsRefresh updates only Trusted section | T257-1 | ✓ |
| Cycle Time NOT in lightweight path | T257-1 (excluded from compute) | ✓ |
| Refresh called after task closure (non-fatal) | T257-3 | ✓ |
| Refresh called on govern tick (non-fatal) | T257-4 | ✓ |
| Full arch report unchanged | T257-1 (additive only) | ✓ |

**Type consistency check:** `TrustedMetrics` defined in `lightweight-metrics-refresh.ts` and imported in `compute-trusted-metrics.ts` and `mark-task-done.ts`. `DeepAnalysisState` defined in `deep-analysis-state.ts` and imported in `govern-system.ts` and `reflect-command.ts`. No cross-task naming conflicts.

**Placeholder scan:** No TBDs, no "implement later", no "similar to" references. All code blocks are complete.
