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

## Integration Points

| Component | Change |
|------|--------|
| `arch govern` | Rebuilds the full ContextIndex, including `tasks`, by passing `gitRepository` into `BuildIndex.execute()` |
| `arch index` | On-demand full rebuild path; same required `gitRepository` dependency |
| `arch task start` | No new command contract; consumes the richer index indirectly through `ContextInference` when a task enters `IN_PROGRESS` |

The integration model preserves the existing two-phase architecture:

- **Build phase owns evidence capture.** Git history is read only while compiling the index.
- **Lookup phase owns relevance interpretation.** Task start never shells out to git; it only reads `index.tasks`.

This separation is non-negotiable. If lookup reaches back into git, the system stops being deterministic and reintroduces runtime cost and repo-state sensitivity into task execution.

---

## Files changed

| File | Change |
|------|--------|
| `cli/src/main/ts/domain/models/context-index.ts` | Add `TaskEntry`, add `tasks` field to `ContextIndex`, bump version to 2 |
| `cli/src/main/ts/domain/repositories/git-repository.ts` | Add `getCommitHistory()` method |
| `cli/src/main/ts/infrastructure/cli/git-cli.ts` | Implement `getCommitHistory()` |
| `cli/src/main/ts/application/use-cases/build-index.ts` | Add required `gitRepository` param, add `buildTaskIndex()` method |
| `cli/src/main/ts/application/use-cases/context-inference.ts` | Add second pass, shared score map, `LOW_SIGNAL_PATTERNS`, `unresolvedTaskRefs`, `filteredFiles` |
| `cli/src/main/ts/application/commands/govern-command.ts` | Pass `gitRepository` to `BuildIndex.execute()` |
| `cli/src/main/ts/application/commands/index-command.ts` | Pass `gitRepository` to `BuildIndex.execute()` |
| `cli/src/main/ts/index.ts` | Wire `gitRepository` into `BuildIndex` invocation |

---

## Testing

- `build-index.test.ts`: verifies `TaskEntry` structural shape, `normalizeCommits()` extraction behavior, case sensitivity, per-commit TASK-ID deduplication, multi-task commit handling, raw field pass-through, `buildTaskIndex()` aggregation, and `commitRefOverflow` observability.
- `context-inference.test.ts`: verifies the task-reference pass adds file relevance without replacing keyword scoring, unresolved TASK-IDs are captured separately from filtered files, and filtered candidates remain observable even when excluded from ranking.
- `git-cli.ts`: no direct unit test for shell interaction. Parsing correctness is validated through `normalizeCommits()` and `BuildIndex` fixtures; command execution remains integration responsibility.

The test boundary is intentional:

- Pure normalization and aggregation logic gets deterministic unit coverage.
- Shelling out to git does not get mocked into a fake notion of correctness.

---

## Failure Behavior

### Build phase

Failure to supply or invoke `gitRepository` is a build failure. The system must not silently emit a version 2 index with an empty or missing `tasks` field under the pretense that auto-linking is active. A partial index here is corruption-by-omission.

If git history returns no task-linked commits, `tasks` is `{}` and that is valid. "No evidence found" is distinct from "could not read evidence."

### Lookup phase

Lookup remains graceful:

- If `.arch/context-index.json` is absent, task start skips context inference as before.
- If `index.tasks` exists but the referenced TASK-ID is absent, inference records the ID in `unresolvedTaskRefs` and continues.
- If all candidate files for a resolved task are filtered by `LOW_SIGNAL_PATTERNS`, inference still records them in `filteredFiles` and continues with whatever other signals remain.

The rule is simple: build failures are hard failures; lookup gaps are soft degradations with traces.

---

## Deferred Calibration

- Tune `DIRECT_TASK_REFERENCE_BOOST` using real task-start feedback. `4.0` is an initial forcing function, not a settled truth.
- Revisit `GIT_LOG_DEPTH` once history coverage can be measured against actual missed references. The bound is operational, not semantic.
- Consider recency weighting inside a single task's history only if real examples show old commits drowning newer causal files. Phase 1 deliberately avoids temporal interpretation.
- Consider separate handling for merge commits only if observed commit discipline makes them necessary. Current design prefers explicit task-tagged commits over merge-derived inference.
- Expose `unresolvedTaskRefs` or `filteredFiles` to operators only if debugging demand justifies a visible command or report. Phase 1 keeps them internal.

---

## Invariants

- No synthetic task link may exist without a literal TASK-ID in commit history. The system links only on explicit references, never fuzzy similarity.
- `tasks` is rebuilt wholesale with the rest of the ContextIndex; there is no incremental task-link patching.
- `recentCommitRefs` is traceability metadata only. It must never be used as a scoring input.
- `touchedFrequency` preserves repeated contact with a file, but task-reference scoring adds one boost per file per referenced TASK-ID, not per historical touch count.
- A filtered file remains part of task provenance forever unless git history changes. Filtering is not deletion.
