# Design: Automatic Entity Linking (Phase 1 / Feature 3)
**Date:** 2026-05-08
**Status:** APPROVED
**ARCH Phase:** 1 — Friction Reduction

## Goal

Materialize task↔commit relationships from git history into the ContextIndex so that ContextInference can surface causally relevant files when a new task explicitly references prior tasks.

## Scope

This design covers one link type only: **tasks↔commits**. ADRs↔tasks, guidelines↔failures, and retros↔patterns are out of scope until this link type proves operational value. Scope was chosen because tasks↔commits is the only link type that immediately changes execution quality in a measurable, deterministic way.

---

## Semantic Contract

This system implements a **curated relevance model**.

- **git = raw evidence.** `getCommitHistory()` returns all files changed in task-linked commits. This is provenance, not inference.
- **filter = heuristic gate.** `LOW_SIGNAL_PATTERNS` reduces scoring influence for files unlikely to represent execution context (tests, lockfiles, config churn). Files matching the filter are lower default weight — not invalid reality. They remain in stored data (`touchedFrequency`) unfiltered. If a filtered file was actually critical, the filter is wrong — not the data.
- **scoring = interpretation layer.** Surviving files receive `DIRECT_TASK_REFERENCE_BOOST`. Score reflects causal likelihood for a new task, not commit proximity.
- **Score aggregation priority:** Direct task-reference signals are additive and cannot be overridden by keyword scoring. They accumulate on top of the keyword pass. They only compete during final ranking.

### Provenance invariant

**TaskEntry defines provenance space. All files in `touchedFrequency` are canonical. Filtering only affects ranking, never identity.**

A file absent from scoring is not absent from the task's history. When debugging "why did this file not appear," the answer is always one of: (a) not in `touchedFrequency` — it was never touched by a task-linked commit; or (b) in `touchedFrequency` but filtered at inference time — it exists, it was just de-ranked. These are different failure modes and must not be conflated.

### Score accumulation invariant

**All scoring passes accumulate into a shared score map before sorting. Passes are order-independent.**

No pass may read the intermediate output of another pass during accumulation. All contributions from all passes (keyword, task-reference, and any future ADR, guideline, or similarity pass) merge into a single `Map<string, number>` before the final sort and slice. This guarantees that pipeline composition does not affect ranking — adding a new scoring pass cannot silently reorder existing results by virtue of execution order.

**Idempotency rule:** scoring increments are idempotent per signal source per file per pass. The keyword pass contributes once per file. The task-reference pass contributes once per file per TASK-ID — not once per commit occurrence. This prevents hidden inflation bias when commit history is noisy (a file touched 12 times by the same task does not receive 12× the boost).

---

## Data Model

### `context-index.ts` changes

```typescript
export interface TaskEntry {
  commitCount: number;
  lastCommitDate: string;                    // ISO committer date of most recent task-linked commit
  touchedFrequency: Record<string, number>;  // file path → commit count; unfiltered raw provenance
  recentCommitRefs: string[];                // short SHAs, bounded to MAX_COMMIT_REFS; for traceability only
  commitRefOverflow: boolean;                // true when commitCount > MAX_COMMIT_REFS; truncation is observable, not silent
}

export interface ContextIndex {
  version: number;   // bumps 1 → 2
  builtAt: string;
  files: Record<string, FileEntry>;
  adrs: Record<string, AdrEntry>;
  guidelines: Record<string, GuidelineEntry>;
  tasks: Record<string, TaskEntry>;           // keyed by canonical TASK-ID e.g. "TASK-142"
}
```

Derived usage: `Object.keys(entry.touchedFrequency)` yields the file set. `files: string[]` is not stored — single source of truth.

### Constants

```typescript
const GIT_LOG_DEPTH = 500;      // sampling strategy, not a truth number; covers typical active history
const MAX_COMMIT_REFS = 20;     // traceability bound; enough for debugging, not a forensic archive
const DIRECT_TASK_REFERENCE_BOOST = 4.0;  // provisional; treat as named constant, not doctrine
```

---

## `git-repository.ts` changes

New method on `GitRepository` interface:

```typescript
getCommitHistory(limit?: number): Promise<Array<{
  hash: string;     // short SHA
  message: string;  // full subject line
  date: string;     // ISO committer date
  files: string[];  // files changed in this commit
}>>;
```

Implementation (`NodeGitRepository`): `git log --format="%h|%s|%cI" --name-only -<limit>`. Parse: split on blank lines between commits, split header line on `|`, collect file names from the lines that follow.

---

## `build-index.ts` changes

### Dependency change

`BuildIndex.execute()` takes `gitRepository: GitRepository` as a **required** parameter (not optional). Tests use a fake implementation. Absence is not abstraction — partial indexes without git history are failures, not modes.

```typescript
async execute(
  contextRules: Record<string, { taskClasses: string[] }>,
  gitRepository: GitRepository,
): Promise<void>
```

Callers that currently omit git must be updated.

### New private method: `buildTaskIndex`

The method is structured as a three-stage pipeline. Concerns are separated even within a single function — commit parsing does not depend on aggregation logic, and aggregation does not depend on git internals.

```typescript
private async buildTaskIndex(git: GitRepository): Promise<Record<string, TaskEntry>>
```

**Stage 1 — fetch:** `git.getCommitHistory(GIT_LOG_DEPTH)` → raw commit structs.

**Stage 2 — normalize:** `normalizeCommits(commits)` — a pure function that takes the raw array and returns `Array<{ taskIds: string[], hash: string, date: string, files: string[] }>`. Responsibility: extract canonical TASK-IDs (`/TASK-\d+/g`, case-sensitive, deduplicated per commit via `Set`). No side effects, no accumulation.

**Stage 3 — aggregate:** iterate normalized commits, build `Record<string, TaskEntry>`:
- Increment `commitCount`
- Update `lastCommitDate` if commit date is newer
- Increment `touchedFrequency[file]` for each file in the commit
- Append `hash` to `recentCommitRefs` if `recentCommitRefs.length < MAX_COMMIT_REFS`
- Set `commitRefOverflow = true` when the first hash is dropped

One commit may reference multiple TASK-IDs. Each ID gets the full file set for that commit.

`normalizeCommits` is a pure function — separately testable without git infrastructure.

---

## `context-inference.ts` changes

### `ContextResult` change

```typescript
export interface ContextResult {
  confidence: number;
  files: ScoredFile[];
  adrs: ScoredAdr[];
  guidelines: ScoredGuideline[];
  unresolvedTaskRefs: string[];  // TASK-IDs found in task text but absent from index; not rendered to user
  filteredFiles: string[];       // files eligible for boost but excluded by LOW_SIGNAL_PATTERNS; not rendered to user
}
```

`unresolvedTaskRefs` and `filteredFiles` are both deduplicated (Set → Array) before storing. Invisible to `formatSection()`. Internal observability only.

These two fields represent distinct signal classes — not interchangeable noise:

- `unresolvedTaskRefs`: **system integrity signal.** TASK-ID referenced in task text but absent from `index.tasks`. Indicates a structural gap — old task predates the index, or commit discipline broke. Failure mode: the system is missing causal data.
- `filteredFiles`: **interpretation signal.** File was in `touchedFrequency` of a resolved task reference, but matched `LOW_SIGNAL_PATTERNS`. It was considered and de-ranked — not missed. Failure mode: the heuristic gate was too aggressive. This is the trace that distinguishes "never evaluated" from "evaluated and rejected."

When debugging: `unresolvedTaskRefs` → investigate process/index integrity. `filteredFiles` → investigate filter calibration. These are different diagnosis paths.

### `score()` method: second pass

`score()` is refactored to accumulate all file contributions into a shared `Map<string, number>` before final sort — per the score accumulation invariant. The keyword pass and task-reference pass both write into this map, never reading each other's intermediate state.

**Keyword pass** (unchanged logic, new accumulation model): populate score map from symbol/tag matches.

**Task-reference pass** (new):

1. Extract canonical TASK-IDs from `taskText` using `/TASK-\d+/g`
2. Deduplicate with `Set` before lookup
3. For each unique ID:
   - If `index.tasks[id]` is absent → add to `unresolvedTaskRefs`, skip
   - Derive candidates: `Object.keys(entry.touchedFrequency)`
   - Partition into passing and filtered sets using `LOW_SIGNAL_PATTERNS`
   - Add filtered files (deduplicated) to `filteredFiles`
   - Accumulate `DIRECT_TASK_REFERENCE_BOOST` into score map for each passing file

**Final step:** sort the unified score map, slice to top N, build `ScoredFile[]` as before.

### `LOW_SIGNAL_PATTERNS` constant

```typescript
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
```

Heuristic compression, not ontological classification. **Governance rule: any addition to `LOW_SIGNAL_PATTERNS` must be justified by observed false-positive contribution in at least 3 tasks.** This prevents aesthetic filtering, premature "clean architecture" instincts, and accidental exclusion of signal classes (infra, migrations, docs-as-code).

---

## What is NOT in this design

- Similarity-based task linking (keyword overlap between tasks) — deferred
- ADRs↔tasks linking — deferred
- Guidelines↔failures linking — deferred
- Retros↔patterns linking — deferred
- `arch ask` query interface — Phase 2
- Any UI or output rendering of task links beyond `unresolvedTaskRefs` debug field

---

## Files changed

| File | Change |
|------|--------|
| `cli/src/main/ts/domain/models/context-index.ts` | Add `TaskEntry`, add `tasks` field to `ContextIndex`, bump version to 2 |
| `cli/src/main/ts/domain/repositories/git-repository.ts` | Add `getCommitHistory()` method |
| `cli/src/main/ts/infrastructure/filesystem/node-git-repository.ts` | Implement `getCommitHistory()` |
| `cli/src/main/ts/application/use-cases/build-index.ts` | Add required `gitRepository` param, add `buildTaskIndex()` method |
| `cli/src/main/ts/application/use-cases/context-inference.ts` | Add second pass, `LOW_SIGNAL_PATTERNS`, `unresolvedTaskRefs` |
| `cli/src/main/ts/application/commands/govern-command.ts` | Pass `gitRepository` to `BuildIndex.execute()` |
| `cli/src/main/ts/application/commands/index-command.ts` | Pass `gitRepository` to `BuildIndex.execute()` |
| `cli/src/main/ts/index.ts` | Wire `gitRepository` into `BuildIndex` invocation |
