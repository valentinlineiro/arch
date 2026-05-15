# IDEA: `arch task start` — Contextual Memory Injection
**Created:** 2026-05-15
**Source:** DaaS Vision
**Status:** DRAFT
**Meta:** P1 | M | local | cli/src/main/ts/

## Problem
Agents often start tasks without full knowledge of relevant ADRs or past failures (Hansei) in the same domain. This leads to rework and repeating historical mistakes.

## Proposed solution
Enhance `arch task start TASK-XXX` to inject "Load-bearing Memory" into `stdout`.

**Mechanism:**
1.  **Identification:**
    - **ADRs:** Match the task's `class` and `context` paths against the `ContextIndex` to find enforced ADRs.
    - **Hansei Failures:** Identify archived tasks with the same `class` and overlapping `context` paths. Filter for `H1-H3` severity Hansei.
2.  **Injection (Stdout):**
    - Print a structured block to stdout before/after the "marking as IN_PROGRESS" message.
    - Include: ADR ID + Title + Core Constraint, and Past Failure Category + Decision + Cost.
3.  **Agent Conditioning:** Since agents read the stdout of the command that started them, they are immediately conditioned by these historical constraints (Option A: Stdout Injection).

## Rationale
This is "Memory as a Service." It ensures that institutional knowledge is present at the exact moment of implementation, without requiring the human to manually query it or polluting the markdown file with transient failure history.

## Dependencies
`ContextInference.ts`, `ContextIndex.json`, `MarkdownTaskRepository.ts`.

## Estimated size
M

### Acceptance Criteria
- [ ] `ContextInference` extended to retrieve Hansei failures from `archive/` based on class match and context overlap.
- [ ] `TaskCommand.execute('start')` captures and prints the inferred Load-bearing Memory block.
- [ ] Stdout block includes enforced ADRs (ID, Title, core constraint).
- [ ] Stdout block includes past Hansei failures (Task ID, Category, Decision, Cost).
- [ ] Formatting is clearly separated from standard command output (e.g., via dashed lines or distinct headers).
- [ ] Verified: Agents picking up a task are correctly conditioned by the printed context (manual/observational check).
- [ ] `arch review` passes.

## Decision
PROMOTE → TASK-890

