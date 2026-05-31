# Code Quality Audit Process — Agent-Emitted Code

**Status:** ACCEPTED  
**Source:** TASK-970  
**Applies to:** All code produced or modified by AI agents in ARCH

---

## Why this exists

Agent-emitted code has a characteristic failure mode: it satisfies the declared ACs and passes CI, but accumulates structural debt that human-authored code rarely produces at the same rate. Symptoms: functions that are individually correct but deeply nested, modules that grow by accretion without a unifying abstraction, and test coverage that is numerically adequate but semantically hollow (tests that assert the wrong things confidently).

This document defines the thresholds, triggers, and review protocol that govern agent-emitted code in ARCH.

---

## Complexity Thresholds

These are hard gates checked by `arch sentinel` and `arch review`:

| Metric | Warning threshold | Blocking threshold |
|--------|------------------|--------------------|
| Cyclomatic complexity per function | ≥ 10 | ≥ 15 |
| Function length (lines) | ≥ 60 | ≥ 100 |
| File length (lines) | ≥ 400 | ≥ 600 |
| Import fan-in (files importing this module) | ≥ 8 | ≥ 12 |
| Nesting depth (if/for/try blocks) | ≥ 4 | ≥ 6 |

When a **blocking** threshold is exceeded, the task that introduced the violation must include:
- A Hansei entry with `**Category:** [TypeHack]` or `[LeakyAbstraction]`
- A Forward Action naming a specific refactor task or accepting the debt explicitly

---

## Linting Rules That Trigger Manual Review

The following patterns in agent-emitted code require a human review pass before the task closes:

1. **`any` cast in non-test code** — `as any` or `: any` outside of test files
2. **Silent catch** — `catch { }` or `catch { /* */ }` without logging or rethrowing
3. **Parallel mutation** — modifying the same data structure in two branches of a conditional
4. **Inline magic strings** — string literals used as type discriminants without a const/enum
5. **Nested async in loop** — `for ... await` inside a `forEach` or `map`

These are not auto-blocking but trigger a review flag in `arch review` output. The Auditor must explicitly clear each flag before the task can close.

---

## Refactoring Sprint Trigger Conditions

A dedicated refactoring sprint is triggered when any of:

- ≥ 3 files exceed the **warning** file-length threshold simultaneously
- The same `[TypeHack]` or `[LeakyAbstraction]` Hansei category fires ≥ 4 times in a sprint
- `arch corpus audit` scores below 75/100 for two consecutive runs
- A single module has ≥ 5 incoming imports (fan-in) and no ADR explaining the centrality

The refactoring sprint is filed as a task with `**class:** 1-code-reasoning` and size `L` or `XL`. It does not add features — its ACs are exclusively structural improvements with measurable outcomes (complexity reduced, lines removed, fan-in reduced).

---

## Peer Review Protocol for Hotspots

A **hotspot** is any file that has been modified by ≥ 3 different tasks in the same sprint.

For hotspot files, before any new task may modify them:
1. The implementer runs `arch audit .` and notes the file's current entity type and edge count
2. If the file appears in `[EMERGENT]` patterns from `arch govern reflect`, the Hansei must reference the pattern
3. The Auditor reviews the task's diff against the hotspot before approving close

---

## First Subject: `drift-checker.ts`

`drift-checker.ts` is the first audit subject (TASK-970). As of the audit:

- **Lines:** ~870 — exceeds warning threshold (400), below blocking threshold (600)
- **Functions:** `checkCommandDrift`, `checkUnappliedADRs`, `checkStaleDepends`, `checkDependsGraph`, `checkTaskTemplateCompliance`, `runInboxHygiene`, `checkCoreFlows` — 7 substantive functions, cyclomatic complexity not yet measured
- **Fan-in:** High — imported by `govern-system.ts`, `check-command.ts`, `review-command.ts`
- **Debt acknowledged:** TASK-1036 (DriftChecker decomposition) filed as P3 L

**Verdict:** Architectural debt acknowledged, not blocking. TASK-1036 is the refactor path.

---

## Process Cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Sentinel check (auto) | Every commit | `arch sentinel` |
| Complexity threshold check | Every `arch review` | `arch review` |
| Hotspot identification | Every `arch govern reflect` | `arch analyze` |
| Full code quality audit | Per sprint (before sprint close) | Human |
| Refactoring sprint decision | When trigger conditions met | Human |
