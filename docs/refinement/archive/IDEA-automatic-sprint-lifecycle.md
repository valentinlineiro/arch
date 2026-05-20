# IDEA: automatic-sprint-lifecycle
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

Sprint lifecycle (open, close, retro) is entirely manual today. A human has to:
- Edit `arch.config.json` to update `currentSprint`
- Write the retro in `docs/RETRO.md`
- Open the next sprint by name

This creates friction and inconsistency. More fundamentally, the **backlog** concept is vestigial: ARCH already has a prioritized READY queue with `P0–P3` and `Focus:yes`. A named "backlog" would either duplicate what `docs/tasks/` already is, or imply a separate curation step that has no agent and no gate. It should be dissolved.

**Sprint** is worth keeping — it is a governance rhythm, not just a label. It provides the shared reference point for retros, velocity tracking, and cadence-gated analysis.

## Proposed direction

**1. Dissolve the backlog concept**
`docs/tasks/` with status READY *is* the backlog. No separate artifact needed. References to "backlog" in docs and guidelines should be replaced with "READY queue" or "backlog (READY tasks)".

**2. Automatic sprint closure trigger**
`arch govern` closes the current sprint when `N` tasks have been archived since sprint open (`sprintCloseAfterN` in arch.config.json, e.g., `15`). Time is not a trigger — in a loop system, the tick is the unit of time. Calendar cadence is excluded by design.

At closure, `arch govern` writes a structured sprint record to `docs/RETRO.md` (committed/delivered/velocity table derived deterministically from the archive), then opens a new sprint with an auto-generated name (e.g., `sprint/vX.Y.Z+1` derived from current version).

**3. Sprint open event written to ledger**
`SPRINT_OPEN` and `SPRINT_CLOSE` events appended to `.arch/focus-ledger.jsonl` so sprint boundaries are queryable by THINK and corpus audit.

**4. THINK retro remains advisory**
The deterministic retro (velocity, sizing accuracy) is written by `arch govern`. THINK may produce a qualitative commentary (patterns, kaizen proposals) as an addendum — advisory, not the canonical record.

## Governance class
Class: II (arch govern change) + III (config schema change)
Evaluates: Sprint lifecycle automation and backlog concept dissolution.
Does NOT evaluate: Task selection or prioritization — those remain `arch govern`'s existing logic.
Boundary risk: Medium — touches `arch.config.json` schema (protected path, needs ADR), `focus-ledger.jsonl` schema, and `arch govern` behavior.

## Decision
PROMOTE → TASK-957

## Decision
DEFERRED: Useful but not blocking. Sprint lifecycle is low-friction today.
