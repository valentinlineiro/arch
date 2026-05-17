# IDEA: Persistent session identity — actor tracking per task
**Created:** 2026-05-17
**Source:** Session observation — ARCH knows what happened but not who did it
**Status:** DRAFT
**Sessions:** 0
**Meta:** P2 | S | 7-operations | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts, cli/src/main/ts/domain/models/task.ts, arch.config.json

## Problem

Every session is anonymous. `arch report` can show cycle time and cost by task size but not by model or provider. You cannot answer: "Is Claude actually better at `1-code-reasoning` than Gemini for this codebase?" The data to answer this question is never captured — the `lockedBy` field stores a user string but not the model or provider.

This means routing decisions (which model for which class) are made on assumption, not evidence.

## Proposed Solution

**Actor field in task lock:** when `arch task start TASK-XXX` is called, write `Actor: <provider>/<model> | <session-id>` to the task meta line alongside `lockedBy` and `lockedAt`. The provider/model is read from `arch.config.json` routing strategies for the task's class and size.

**`arch report` extension:** break down cycle time and Hansei severity distribution by Actor. After 20+ tasks, this produces meaningful signal: "claude-code/sonnet averages 8 turns on M tasks; gemini/pro averages 14 turns on the same class."

**Non-intrusive:** if Actor is absent (manual task start, pre-existing tasks), report falls back to current behavior. No breaking change.

## Constraint Axes
- Dependency ordering: None
- Temporal validity: Valid now; signal only appears after corpus of actor-tagged tasks
- Abstraction layer: Correct — metadata only, no governance path changes
- Observability validity: Deterministic — read from config at start time
- Priority displacement: P2

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason | DEFERRED: reason + condition -->
