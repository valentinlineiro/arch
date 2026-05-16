# IDEA: Backlog-implementation sweep — detect pre-implemented tasks before focus assignment
**Created:** 2026-05-16
**Source:** Operational pattern — 4 consecutive resurrected tasks (895, 896, 894, 245) found already implemented
**Status:** PROMOTED
**Sessions:** 0
**Meta:** P2 | S | 7-operations | docs/, cli/src/main/ts/

## Problem

Four consecutive tasks in this session were found fully implemented before any code was written. Each consumed focus ticks, govern cycles, and audit time. The pattern: IDEAs predating a major codebase rewrite (DriftChecker v2, EscalationStore, HanseiAuditor) were resurrected and promoted without checking whether the implementation already existed.

There is currently no mechanism to detect this before a task is assigned focus.

## Proposed Solution

**A. `arch task next --verify` flag**

Before returning the focus task, run a lightweight pre-flight check: scan the task's `file:` and `cmd:` predicates. If all `cmd:` predicates pass and all `file:` paths exist, emit a warning: `[PRE-IMPL] TASK-XXX — all predicates already pass. Verify this task is not pre-implemented before starting.`

This is not a block — it is a signal. The human decides whether to close immediately or proceed.

**B. Reconciliation step in resurrection flow**

When a task is resurrected from archive (Status: DRAFT reset from REJECTED/DEFERRED), THINK Phase 2 should include a pre-flight check of the task's file: predicates before evaluating the IDEA. If the predicates already pass, emit `[PRE-IMPL-SIGNAL]` in the IDEA evaluation output.

## Decision
PROMOTE → TASK-902

## Session 1 Refinement (2026-05-16)
**Scope decision:** Option A only. `arch task next --verify` flag runs pre-flight before returning focus task. Option B (THINK Phase 2 reconciliation) deferred — too coupled to THINK internals, harder to test. 

**Constraint resolved:** The `--verify` flag uses `DeterministicACVerifier` which already exists. If all `cmd:` and `file:` predicates pass on a READY task, emit warning and exit 0 (not 1 — it is a signal, not a block). Human decides whether to close immediately.

**Acceptance criteria pre-draft:**
- `arch task next --verify` runs `DeterministicACVerifier` on the focus task before returning it
- If all predicates pass → emit `[PRE-IMPL] TASK-XXX — all predicates already pass`
- Task is still returned (non-blocking)
- `arch task next` (no flag) is unchanged
**Sessions:** 1
