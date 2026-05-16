# IDEA: Backlog-implementation sweep — detect pre-implemented tasks before focus assignment
**Created:** 2026-05-16
**Source:** Operational pattern — 4 consecutive resurrected tasks (895, 896, 894, 245) found already implemented
**Status:** DRAFT
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
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
