# IDEA: automate-turn-count-recording
**Created:** 2026-05-13
**Source:** Phase-3
**Status:** PROMOTED
**Sessions:** 0
**Meta:** P1 | S | cli/src/main/ts/application/use-cases/loop-engine.ts, docs/KAIZEN-LOG.md

## Problem
Mura detection (Phase 3 of THINK) depends on `Turns: N` metadata in archived tasks. Currently, this field is manual and consistently omitted by agents, leading to a total loss of cycle-time data. Manual recording in a high-velocity loop is a brittle strategy.

## Proposed solution
Automate turn-count recording in the `arch task done` command (or the internal `ArchiveTask` use-case). The system already knows the number of turns in the current session (or can derive it from the git log since the task was set to `IN_PROGRESS`).

## Governance class
Class: I
Evaluates: Presence of metadata field.
Does NOT evaluate: Accuracy of the count if derived from non-deterministic sources.

## Structural admissibility (5-axis)

| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | Satisfied | Internal ArchiveTask use-case exists. |
| Temporal validity | Satisfied | Mura detection currently blind due to lack of turn data. |
| Abstraction layer | Satisfied | Correct layer for operational metadata. |
| Observability validity | Satisfied | Turns are derivable from git history or session context. |
| Priority displacement | Satisfied | P1 — required for cycle-time metrics. |

**Structural admissibility:** satisfied.

## Decision
PROMOTE → TASK-905

## Decision
PROMOTE → TASK-905
