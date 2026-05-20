# IDEA: verify-pre-existing-before-start — detect pre-implemented tasks before marking IN_PROGRESS
**Created:** 2026-05-16
**Source:** TASK-267 + TASK-268 + TASK-279 Hansei H2 — pattern recurred 3 times same session
**Status:** PROMOTED
**Meta:** P1 | S | 1-code-reasoning | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts

## Problem

Tasks are sometimes scaffolded after the implementation already exists in the repo. The agent creates the task, marks it IN_PROGRESS, "implements" it (the code is already there), and closes it — producing a task whose Hansei says H0 but whose diff is empty or nearly empty. This inflates completed task count, produces misleading cycle time data, and means the DoR gate is a formality rather than a real check.

This pattern recurred in three tasks in the same session (TASK-267, TASK-268, TASK-279). It is a systemic gap: `arch task start` validates Definition of Ready but does not check whether the implementation already exists.

## Proposed Solution

**Pre-existence check in `MarkTaskInProgress`:** before marking IN_PROGRESS, run a lightweight check:

1. For each `file:` predicate in the task's ACs, check if the file already exists AND its content already satisfies the predicate.
2. For each `cmd:` predicate, optionally run it (if fast — exit-code-only, no output capture) to see if it already passes.
3. If all verifiable ACs already pass: emit a WARNING: "This task may be pre-implemented. ACs pass before any work was done. Consider using arch task done directly or verifying the task is genuinely new work."

This is advisory, not blocking — the agent decides whether to proceed or close immediately. The Hansei wizard should then ask: "Did you implement this, or was it pre-existing?" as a targeted question.

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now; pattern will recur without the check
- Abstraction layer: Correct — lifecycle gate
- Observability validity: Deterministic — file existence + command exit code
- Priority displacement: P1 — directly addresses integrity gap in the corpus

## Decision
PROMOTE → TASK-978
