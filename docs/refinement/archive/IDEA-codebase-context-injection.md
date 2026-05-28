## IDEA: Codebase-aware context injection from declared task paths

**Status:** PROMOTED → TASK-1067
**Created:** 2026-05-28
**Source:** smartcart-os pilot retrospective — every implementation task showed confidence 0.00 because the context injector indexed governance artifacts (EVENTS.md, focus-ledger.jsonl) instead of the source files declared in the task's context path. The context path field (e.g. `cli/src/main/ts/`) is used to scope git evidence but is not used to seed the relevant-files suggestion.
**Candidate-class:** 2-code-generation
**Candidate-size:** M
**Depends:** none
**Sessions:** 1

---

## Problem

`arch task start TASK-XXX` injects context by querying the corpus for semantically similar past tasks. When the corpus contains only governance artifacts (new project, first sprint), every query returns 0.00 confidence. The human receives no useful context.

The task meta line already contains a context path:
```
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude-code | src/server/routes/
```

This path is used today to scope `git log` evidence. It is not used to answer: "what are the most-changed functions in this directory recently, and what do those files look like?"

The result in smartcart-os:
- TASK-008 declared `server/routes/` as context path
- Context injection returned ARCH governance history
- The implementing agent had no visibility into the existing route handlers, middleware stack, or which endpoints existed before starting

The confidence score is a symptom. The root cause is that the context system doesn't read the codebase — it only reads the governance history.

---

## Proposed Fix

Extend `arch task start` context injection with a codebase phase that runs before (or instead of, when corpus confidence is low) the corpus query:

**Step 1: Identify candidate files**
For each path segment in the task's declared context field, list files matching common source extensions (`.ts`, `.tsx`, `.js`, `.py`, `.go`, etc.). Cap at 20 files.

**Step 2: Surface recently changed functions/components**
Run `git log --since=30.days --diff-filter=M -- <context-path>` to find files changed in the last 30 days. For each changed file, extract the changed function/class names from the diff (via `git diff HEAD~10 HEAD -- <file> | grep "^@@.*@@"`). Surface the 5–10 most-frequently-changed symbols.

**Step 3: Inject as context suggestion**
Prepend the context injection output with:
```
[CODEBASE-CONTEXT] Based on declared context path src/server/routes/:
  Most changed recently: createInventoryRoute (3x), handleCheckout (2x), authMiddleware (2x)
  Files: src/server/routes/inventory.ts, src/server/routes/checkout.ts
  Confidence: git-derived (no corpus match)
```

This runs when corpus confidence < 0.3. When corpus confidence ≥ 0.3, the corpus result takes precedence and codebase context is appended as a secondary block.

**No new dependencies.** Uses only `git log` and `git diff`, which are already available in the execution environment.

---

## Scope limits

- This is a heuristic. "Most changed recently" is a proxy for "relevant" — it can miss files that are important but stable.
- The symbol extraction from diff hunks is approximate (regex on `@@ ... @@ funcName`). It will miss anonymous functions and some language patterns.
- This does not replace corpus learning. Once the corpus has implementation history from the project, that signal is stronger. The codebase phase is a bootstrap solution for new projects and first sprints.

---

## Acceptance Criteria

- [ ] `arch task start` on a task with declared context path surfaces recently changed files in that path  →  prose: verified by starting a task with a context path containing recently modified files
- [ ] Output includes `[CODEBASE-CONTEXT]` block when corpus confidence is below threshold  →  prose: verified on a new project with empty corpus
- [ ] Codebase context is appended (not primary) when corpus confidence ≥ 0.3  →  prose: verified on a project with populated corpus
- [ ] Context injection completes in under 3 seconds on a repo with 500+ files  →  prose: verified by timing arch task start on the cli/ subdirectory
- [ ] All existing tests pass  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

PROMOTE → TASK-1067

