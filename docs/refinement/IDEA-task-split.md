# IDEA: arch task split TASK-XXX — decompose large task
**Created:** 2026-05-17
**Source:** Session observation — L tasks grow during refinement with no decomposition mechanic
**Status:** DRAFT
**Sessions:** 0
**Meta:** P2 | S | 2-code-generation | cli/src/main/ts/application/commands/task-command.ts

## Problem

Tasks sized L or XL must be decomposed before entering READY (TASK-FORMAT rule). But decomposition today is manual: human creates 2–3 new task files, copies context, sets up dependencies, and archives the original. This is 10+ minutes of overhead that discourages correct decomposition and creates corpus debt (the original L task has no audit trail of why it was split).

## Proposed Solution

`arch task split TASK-XXX` — interactive decomposition:

1. Reads the original task file
2. Prompts: "How many sub-tasks? (2-4)"
3. For each sub-task: prompts for title and which ACs to inherit
4. Creates `TASK-XXX-a`, `TASK-XXX-b`, etc. with:
   - Inherited context, class, CLI, and priority from parent
   - `Depends: TASK-XXX-a` chain if sequential, or parallel if no dependency declared
   - `Spawned-from: TASK-XXX` field for audit trail
5. Archives original task as `SUPERSEDED → TASK-XXX-a, TASK-XXX-b` with status DONE and closed-at timestamp

Non-TTY fallback: `arch task split TASK-XXX --titles "Auth middleware,Token refresh,Session cleanup"` — non-interactive, splits evenly.

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now
- Abstraction layer: Correct — task lifecycle management
- Observability validity: Deterministic — creates files, no inference
- Priority displacement: P2

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
