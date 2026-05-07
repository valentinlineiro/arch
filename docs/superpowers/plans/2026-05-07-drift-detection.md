# FEATURE 4 — Drift Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three deterministic drift checks to `DriftChecker`, update `THINK.md` with the Phase 3.5 semantic drift protocol, and write an ADR documenting the two-tier architecture.

**Architecture:** Three new methods added to the existing `DriftChecker` domain service in `drift-checker.ts`, each following the `DriftResult` contract. A Phase 3.5 block is inserted into `THINK.md` between Phase 3 and Phase 4. An ADR documents the two-tier enforcement/cognition separation.

**Tech Stack:** TypeScript, Node.js built-in test runner (`node:test`), `node:assert`

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `cli/src/main/ts/domain/services/drift-checker.ts` | Modify | Add `checkOrphanTasks`, `checkObsoleteGuidelines`, `checkUnappliedADRs`; register all three in `check()` |
| `cli/src/test/ts/drift-checker.test.ts` | Modify | Add tests for all three new checks |
| `docs/agents/THINK.md` | Modify | Insert Phase 3.5 between Phase 3 and Phase 4 |
| `docs/adr/ADR-013-two-tier-drift-detection.md` | Create | Document the two-tier architecture decision |

---

## Task 1: `checkOrphanTasks`

**Files:**
- Modify: `cli/src/test/ts/drift-checker.test.ts`
- Modify: `cli/src/main/ts/domain/services/drift-checker.ts`

### Background

A task is an orphan if it is not reachable from the active root set via directed BFS. The active root set = all tasks in `docs/tasks/` where Meta status ∈ `{READY, IN_PROGRESS}`. The graph is built in the **enables direction**: if `A Depends: B`, add edge `B → A` (B enables A). Starting from active roots, BFS follows these edges. Any task not reached is an orphan.

- [ ] **Step 1.1: Write the failing tests**

Append to `cli/src/test/ts/drift-checker.test.ts`:

```typescript
// ─── OrphanTasks ─────────────────────────────────────────────────────────────

test('OrphanTasks - OK when all tasks are in the active root set', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - OK when a downstream task is reachable from an active root', async () => {
  const fs = makeBaseFs();
  // TASK-001 is READY (active root). TASK-002 Depends: TASK-001 → reachable via enables edge.
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P2 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** TASK-001';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - OK for a transitive downstream chain from an active root', async () => {
  const fs = makeBaseFs();
  // Chain: TASK-001 (READY) → enables TASK-002 → enables TASK-003
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md', 'TASK-003.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P2 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** TASK-001';
  fs.files['/repo/docs/tasks/TASK-003.md'] =
    '## TASK-003: C\n**Meta:** P3 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** TASK-002';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('OrphanTasks - WARN when a task is structurally disconnected from all active roots', async () => {
  const fs = makeBaseFs();
  // TASK-001 is READY. TASK-002 has no connection to TASK-001.
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md', 'TASK-002.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';
  fs.files['/repo/docs/tasks/TASK-002.md'] =
    '## TASK-002: B\n**Meta:** P3 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('TASK-002') && d.includes('orphan')));
});

test('OrphanTasks - OK when no active root set exists (empty system)', async () => {
  const fs = makeBaseFs();
  // No READY or IN_PROGRESS tasks — nothing to traverse from, nothing to flag.
  fs.directories['/repo/docs/tasks'] = ['TASK-001.md'];
  fs.files['/repo/docs/tasks/TASK-001.md'] =
    '## TASK-001: A\n**Meta:** P1 | S | BLOCKED | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'OrphanTasks');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A2 "OrphanTasks"
```

Expected: tests fail with `check?.check === undefined` (method not registered yet).

- [ ] **Step 1.3: Implement `checkOrphanTasks` in `drift-checker.ts`**

Add this method to the `DriftChecker` class (before `getMarkdownFiles`):

```typescript
private async checkOrphanTasks(): Promise<DriftResult> {
  const activeFiles = await this.getMarkdownFiles('docs/tasks');

  interface TaskNode { id: string; status: string; dependsOn: string[] }
  const tasks: TaskNode[] = [];

  for (const file of activeFiles) {
    const content = await this.fileSystem.readFile(`${this.rootPath}/docs/tasks/${file}`);
    const id = file.replace('.md', '');
    const metaMatch = content.match(/^\*\*Meta:\*\* .*/m);
    const status = metaMatch ? metaMatch[0].split('|').map(s => s.trim())[2] : '';
    const dependsMatch = content.match(/^\*\*Depends:\*\* (.*)/m);
    const dependsOn = dependsMatch
      ? dependsMatch[1].split(',').map(s => s.trim()).filter(s => s && s !== 'none')
      : [];
    tasks.push({ id, status, dependsOn });
  }

  const activeRootIds = new Set(
    tasks.filter(t => t.status === 'READY' || t.status === 'IN_PROGRESS').map(t => t.id)
  );

  if (activeRootIds.size === 0) {
    return { check: 'OrphanTasks', status: 'OK', details: [] };
  }

  // Build enables graph: dependency → [dependents that need it]
  const enables = new Map<string, string[]>();
  for (const task of tasks) {
    for (const dep of task.dependsOn) {
      if (!enables.has(dep)) enables.set(dep, []);
      enables.get(dep)!.push(task.id);
    }
  }

  // BFS from active roots following enables edges
  const reachable = new Set<string>(activeRootIds);
  const queue = [...activeRootIds];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dependent of enables.get(current) ?? []) {
      if (!reachable.has(dependent)) {
        reachable.add(dependent);
        queue.push(dependent);
      }
    }
  }

  const details = tasks
    .filter(t => !reachable.has(t.id))
    .map(t => `${t.id} is not reachable from any active node (orphan task).`);

  return { check: 'OrphanTasks', status: details.length === 0 ? 'OK' : 'WARN', details };
}
```

- [ ] **Step 1.4: Register the new check in `check()`**

In the `check()` method, add `this.checkOrphanTasks()` to the `Promise.all([...])` array alongside the existing 17 checks.

- [ ] **Step 1.5: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A2 "OrphanTasks"
```

Expected: all 5 OrphanTasks tests pass.

- [ ] **Step 1.6: Commit**

```bash
git add cli/src/main/ts/domain/services/drift-checker.ts cli/src/test/ts/drift-checker.test.ts
git commit -m "feat: [TASK-215] add checkOrphanTasks to DriftChecker

Directed BFS from active root set (READY/IN_PROGRESS) following
enables-direction edges. Tasks unreachable from active frontier
are flagged as orphan.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: `checkObsoleteGuidelines`

**Files:**
- Modify: `cli/src/test/ts/drift-checker.test.ts`
- Modify: `cli/src/main/ts/domain/services/drift-checker.ts`

### Background

Scan every `docs/guidelines/*.md` file for backtick-quoted paths. For each extracted path, verify it exists in the repo. Non-existent paths are obsolete references. Uses the same regex patterns as the existing `checkAgentsPaths` check.

- [ ] **Step 2.1: Write the failing tests**

Append to `cli/src/test/ts/drift-checker.test.ts`:

```typescript
// ─── ObsoleteGuidelines ───────────────────────────────────────────────────────

test('ObsoleteGuidelines - OK when all referenced paths exist', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/guidelines'] = ['core.md'];
  fs.files['/repo/docs/guidelines/core.md'] = 'See `docs/tasks/` for task files.';
  fs.directories['/repo/docs/tasks'] = [];

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('ObsoleteGuidelines - WARN when a guideline references a dead path', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/guidelines'] = ['core.md'];
  fs.files['/repo/docs/guidelines/core.md'] = 'Old rule: use `docs/sprint/` folder.';
  // docs/sprint/ does NOT exist in the mock fs

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('core.md') && d.includes("docs/sprint/")));
});

test('ObsoleteGuidelines - OK when guidelines directory does not exist', async () => {
  const fs = makeBaseFs();
  // No docs/guidelines directory at all

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('ObsoleteGuidelines - skips glob patterns (paths with *)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/guidelines'] = ['core.md'];
  fs.files['/repo/docs/guidelines/core.md'] = 'Files matching `docs/tasks/*.md` are task files.';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'ObsoleteGuidelines');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A2 "ObsoleteGuidelines"
```

Expected: tests fail (method not registered).

- [ ] **Step 2.3: Implement `checkObsoleteGuidelines` in `drift-checker.ts`**

Add this method to the `DriftChecker` class:

```typescript
private async checkObsoleteGuidelines(): Promise<DriftResult> {
  const guidelinesDir = `${this.rootPath}/docs/guidelines`;
  if (!(await this.fileSystem.exists(guidelinesDir))) {
    return { check: 'ObsoleteGuidelines', status: 'OK', details: [] };
  }

  const files = (await this.fileSystem.readDirectory(guidelinesDir)).filter(f => f.endsWith('.md'));
  const details: string[] = [];

  for (const file of files) {
    const content = await this.fileSystem.readFile(`${guidelinesDir}/${file}`);
    const refs = new Set<string>();

    for (const match of content.matchAll(/`([a-zA-Z][a-zA-Z0-9/_\-\.]+\.[a-zA-Z]{1,5})`/g)) {
      refs.add(match[1]);
    }
    for (const match of content.matchAll(/`(docs\/[a-zA-Z0-9/_\-\.]*)`/g)) {
      refs.add(match[1]);
    }

    for (const ref of refs) {
      if (ref.includes('*')) continue;
      const exists = await this.fileSystem.exists(`${this.rootPath}/${ref}`);
      if (!exists) {
        details.push(`docs/guidelines/${file}: dead reference '${ref}'`);
      }
    }
  }

  return { check: 'ObsoleteGuidelines', status: details.length === 0 ? 'OK' : 'WARN', details };
}
```

- [ ] **Step 2.4: Register in `check()`**

Add `this.checkObsoleteGuidelines()` to the `Promise.all([...])` array in `check()`.

- [ ] **Step 2.5: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A2 "ObsoleteGuidelines"
```

Expected: all 4 ObsoleteGuidelines tests pass.

- [ ] **Step 2.6: Commit**

```bash
git add cli/src/main/ts/domain/services/drift-checker.ts cli/src/test/ts/drift-checker.test.ts
git commit -m "feat: [TASK-215] add checkObsoleteGuidelines to DriftChecker

Scans docs/guidelines/*.md for dead path references using the same
backtick extraction pattern as checkAgentsPaths.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: `checkUnappliedADRs`

**Files:**
- Modify: `cli/src/test/ts/drift-checker.test.ts`
- Modify: `cli/src/main/ts/domain/services/drift-checker.ts`

### Background

For every ADR in `docs/adr/` where `**Status:** ACCEPTED`, check whether its ID (e.g., `ADR-006`) appears in any file under `docs/tasks/` or `docs/archive/`. If no task file references it, the ADR has no execution trail.

- [ ] **Step 3.1: Write the failing tests**

Append to `cli/src/test/ts/drift-checker.test.ts`:

```typescript
// ─── UnappliedADRs ────────────────────────────────────────────────────────────

test('UnappliedADRs - OK when all ACCEPTED ADRs are referenced in task files', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-001-some-decision.md'];
  fs.files['/repo/docs/adr/ADR-001-some-decision.md'] =
    '# ADR-001\n**Status:** ACCEPTED\n\n## Decision\nWe use git.';
  fs.directories['/repo/docs/tasks'] = ['TASK-010.md'];
  fs.files['/repo/docs/tasks/TASK-010.md'] =
    '## TASK-010: Implement ADR-001\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | none\n**Depends:** none\nImplements ADR-001.';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('UnappliedADRs - WARN when an ACCEPTED ADR has no task reference', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-003-some-decision.md'];
  fs.files['/repo/docs/adr/ADR-003-some-decision.md'] =
    '# ADR-003\n**Status:** ACCEPTED\n\n## Decision\nWe use flat files.';
  fs.directories['/repo/docs/tasks'] = ['TASK-010.md'];
  fs.files['/repo/docs/tasks/TASK-010.md'] =
    '## TASK-010: Something else\n**Meta:** P1 | S | READY | Focus:yes | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'WARN');
  assert.ok(check?.details.some(d => d.includes('ADR-003') && d.includes('never referenced')));
});

test('UnappliedADRs - OK for DRAFT and SUPERSEDED ADRs (not checked)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-002-draft.md', 'ADR-004-old.md'];
  fs.files['/repo/docs/adr/ADR-002-draft.md'] =
    '# ADR-002\n**Status:** DRAFT\n\n## Decision\nTBD.';
  fs.files['/repo/docs/adr/ADR-004-old.md'] =
    '# ADR-004\n**Status:** SUPERSEDED\n\n## Decision\nOld way.';
  fs.directories['/repo/docs/tasks'] = [];

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('UnappliedADRs - OK when ADR is referenced in archive (not just tasks)', async () => {
  const fs = makeBaseFs();
  fs.directories['/repo/docs/adr'] = ['ADR-005-archived-impl.md'];
  fs.files['/repo/docs/adr/ADR-005-archived-impl.md'] =
    '# ADR-005\n**Status:** ACCEPTED\n\n## Decision\nUse flat tasks.';
  fs.directories['/repo/docs/tasks'] = [];
  fs.directories['/repo/docs/archive'] = ['TASK-005.md'];
  fs.files['/repo/docs/archive/TASK-005.md'] =
    '## TASK-005: Implemented ADR-005\n**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude | none\n**Depends:** none';

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});

test('UnappliedADRs - OK when docs/adr directory does not exist', async () => {
  const fs = makeBaseFs();
  // No docs/adr directory

  const checker = new DriftChecker(fs, new MockGitRepository(), '/repo', '0.2.0');
  const result = await checker.check();
  const check = result.find(r => r.check === 'UnappliedADRs');

  assert.ok(check);
  assert.strictEqual(check?.status, 'OK');
});
```

- [ ] **Step 3.2: Run tests to verify they fail**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A2 "UnappliedADRs"
```

Expected: tests fail (method not registered).

- [ ] **Step 3.3: Implement `checkUnappliedADRs` in `drift-checker.ts`**

Add this method to the `DriftChecker` class:

```typescript
private async checkUnappliedADRs(): Promise<DriftResult> {
  const adrDir = `${this.rootPath}/docs/adr`;
  if (!(await this.fileSystem.exists(adrDir))) {
    return { check: 'UnappliedADRs', status: 'OK', details: [] };
  }

  const adrFiles = (await this.fileSystem.readDirectory(adrDir)).filter(f => f.endsWith('.md'));

  // Build combined search corpus from tasks + archive
  const searchDirs = ['docs/tasks', 'docs/archive'];
  const corpus: string[] = [];
  for (const dir of searchDirs) {
    const dirPath = `${this.rootPath}/${dir}`;
    if (!(await this.fileSystem.exists(dirPath))) continue;
    const files = (await this.fileSystem.readDirectory(dirPath)).filter(f => f.endsWith('.md'));
    for (const file of files) {
      corpus.push(await this.fileSystem.readFile(`${dirPath}/${file}`));
    }
  }
  const combinedCorpus = corpus.join('\n');

  const details: string[] = [];
  for (const adrFile of adrFiles) {
    const content = await this.fileSystem.readFile(`${adrDir}/${adrFile}`);
    const statusMatch = content.match(/^\*\*Status:\*\*\s*(.+)/m);
    if (!statusMatch || statusMatch[1].trim() !== 'ACCEPTED') continue;

    const idMatch = adrFile.match(/^(ADR-\d+)/);
    if (!idMatch) continue;
    const adrId = idMatch[1];

    if (!combinedCorpus.includes(adrId)) {
      details.push(`${adrId}: ACCEPTED but never referenced in any task file.`);
    }
  }

  return { check: 'UnappliedADRs', status: details.length === 0 ? 'OK' : 'WARN', details };
}
```

- [ ] **Step 3.4: Register in `check()`**

Add `this.checkUnappliedADRs()` to the `Promise.all([...])` array in `check()`.

- [ ] **Step 3.5: Run tests to verify they pass**

```bash
cd /home/valentin/code/arch/cli && npm test 2>&1 | grep -A2 "UnappliedADRs"
```

Expected: all 5 UnappliedADRs tests pass.

- [ ] **Step 3.6: Commit**

```bash
git add cli/src/main/ts/domain/services/drift-checker.ts cli/src/test/ts/drift-checker.test.ts
git commit -m "feat: [TASK-215] add checkUnappliedADRs to DriftChecker

Flags ACCEPTED ADRs never referenced in docs/tasks or docs/archive.
Measures traceability, not impact — known limit documented in spec.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Build verification and full test suite

**Files:**
- No new changes — validate all prior work

- [ ] **Step 4.1: Run the full test suite**

```bash
cd /home/valentin/code/arch/cli && npm test
```

Expected: all tests pass (including existing 17 checks + 14 new tests). No regressions.

- [ ] **Step 4.2: Build the CLI**

```bash
cd /home/valentin/code/arch/cli && npm run build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 4.3: Run `arch review` against the real repo**

```bash
arch review
```

Expected: the three new checks appear in the output. Note any new WARNs from the live repo (these are real findings — do not suppress them).

---

## Task 5: THINK.md Phase 3.5 and ADR-013

**Files:**
- Modify: `docs/agents/THINK.md`
- Create: `docs/adr/ADR-013-two-tier-drift-detection.md`

- [ ] **Step 5.1: Insert Phase 3.5 into `docs/agents/THINK.md`**

Insert the following block between the `## Phase 3` section and the `## Phase 4` section:

```markdown
## Phase 3.5: Semantic Drift Analysis (Observer)
0. **Print:** `[THINK] Phase 3.5 — Semantic Drift Analysis` to stdout.
1. **Skip condition:** If running under time pressure or minimal-mode flag, skip this phase and print `[THINK] Phase 3.5 — skipped`.
2. **Inputs to read:** `docs/guidelines/*.md` (full content), `docs/adr/*.md` (Context + Decision sections of ACCEPTED ADRs), `docs/tasks/` (Meta lines + ACs only), `docs/archive/` (Meta lines only), `docs/refinement/IDEA-*.md` (DRAFT and PROMOTED entries).
3. **Analysis — Conceptual contradictions:** Identify any two guideline sections that assert conflicting behaviors for the same domain (e.g., commit frequency defined differently in two files). If found, emit `[SEMANTIC-DRIFT] contradiction: <file-A>:<section> vs <file-B>:<section> — <description>` to stdout.
4. **Analysis — Structural duplication:** Identify materially identical sections or rules appearing in more than one guideline file. If found, emit `[SEMANTIC-DRIFT] duplication: <file-A>:<section> ≈ <file-B>:<section>` to stdout.
5. **Analysis — ADR conceptual drift:** Identify ACCEPTED ADRs whose stated rationale conflicts with how the system currently operates (judged against active tasks and current guidelines). If found, emit `[SEMANTIC-DRIFT] adr-drift: <ADR-ID> — rationale no longer matches observed system behavior` to stdout.
6. **Output rule:** For each finding that warrants action, create a new IDEA file in `docs/refinement/IDEA-<slug>.md` with `Source: Phase-3.5` in the Meta line. Do NOT create tasks directly. Do NOT modify DriftChecker or any enforcement layer.
7. **Max output:** At most 3 new IDEAs per THINK run from this phase. If more findings exist, queue them for the next session.
8. **Phase boundary:** This phase is a semantic observer, not an enforcement layer. Its output feeds Phase 3 (refinement queue) and Phase 4 (Kaizen). It never feeds `arch review` or `DriftChecker`.
```

- [ ] **Step 5.2: Create `docs/adr/ADR-013-two-tier-drift-detection.md`**

```markdown
# ADR-013: Two-Tier Drift Detection Architecture

**Date:** 2026-05-07
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

---

## Context

ARCH needed to detect five categories of organizational drift: orphan tasks, obsolete guideline references, unapplied ADRs, contradictory guidelines, and structural repetition. A naive approach would add all five as checks in DriftChecker, but three of the five (contradictions, repetition, ADR conceptual drift) require semantic analysis that cannot be made deterministic or reproducible by a rule-based TypeScript parser.

Mixing deterministic and probabilistic checks in the same enforcement layer creates a system where some WARNs are reproducible and some are opinion-dependent, making the tool unreliable as an audit gate.

## Decision

Split drift detection into two tiers with distinct responsibilities:

**Tier 1 — DriftChecker (deterministic enforcement layer):** three new mechanical checks are added: `checkOrphanTasks` (directed graph reachability from active root set), `checkObsoleteGuidelines` (dead path references in guideline files), `checkUnappliedADRs` (ACCEPTED ADRs with no task reference). All three are 100% deterministic, reproducible, and audit-able.

**Tier 2 — THINK Phase 3.5 (semantic cognition layer):** a new phase in the THINK protocol handles contradictions, structural repetition, and ADR conceptual drift using LLM reasoning. Phase 3.5 produces IDEA files for the refinement queue — it never writes to DriftChecker output, never blocks `arch review`, and never creates tasks directly.

## Rationale

- **Reproducibility:** `arch review` is used as an audit gate and must be deterministic. Introducing LLM-based checks would make results non-reproducible across runs.
- **Separation of concerns:** DriftChecker answers "is the system structurally broken?" THINK Phase 3.5 answers "is the system evolving inconsistently?" These are different questions requiring different tools.
- **Auditability:** Every DriftChecker WARN can be traced to a specific line of parsed text. THINK Phase 3.5 findings are insights, not violations.

## Consequences

**Positive:**
- DriftChecker remains a pure truth layer — fully deterministic, zero LLM dependency.
- Semantic analysis is available through THINK without polluting the enforcement model.
- The Active Root Set definition (READY + IN_PROGRESS tasks) is explicit and auditable.

**Negative:**
- Semantic drift findings are visible only when THINK runs — not on every `arch review`.
- Contradictions and structural repetition are not caught automatically by the CLI.

**Extension points:**
- When `docs/intents/` is introduced with CAPTURED/PROMOTED statuses, those nodes extend the DriftChecker active root set as the true causal origin of the system.
- IDEA source typing (`Source: phase-3 | phase-3.5`) should be formalized when the refinement queue scales.
```

- [ ] **Step 5.3: Run `arch review` to confirm no regressions**

```bash
arch review
```

Expected: passes (the new ADR is ACCEPTED and references TASK-215, so `checkUnappliedADRs` will not flag it).

- [ ] **Step 5.4: Commit**

```bash
git add docs/agents/THINK.md docs/adr/ADR-013-two-tier-drift-detection.md
git commit -m "feat: [TASK-215] add THINK Phase 3.5 and ADR-013

Phase 3.5 adds semantic drift analysis as a cognitive observer layer
inside THINK. ADR-013 documents the two-tier enforcement/cognition
separation decision.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Archive TASK-215

- [ ] **Step 6.1: Check all ACs in `docs/tasks/TASK-215.md`**

Mark all acceptance criteria as checked (`- [x]`).

- [ ] **Step 6.2: Move to archive**

```bash
git mv docs/tasks/TASK-215.md docs/archive/TASK-215.md
```

Add a `## Hansei` section at the end of the file:

```markdown
## Hansei
Active root set is execution-centric (READY/IN_PROGRESS) — the shift to intention-centric (INTENT nodes) will require revisiting the orphan semantics when docs/intents/ is introduced.
```

- [ ] **Step 6.3: Commit**

```bash
git add docs/archive/TASK-215.md
git commit -m "chore: [TASK-215] archive — all ACs verified, arch review passes

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
