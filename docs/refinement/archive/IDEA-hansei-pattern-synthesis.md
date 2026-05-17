# IDEA: Hansei pattern synthesis in arch reflect
**Created:** 2026-05-17
**Source:** Session observation — SignalRouter appends signals but THINK never synthesizes them into recommendations
**Status:** PROMOTED
**Sessions:** 0
**Meta:** P1 | M | 1-code-reasoning | cli/src/main/ts/application/use-cases/causal-signal-log.ts, docs/agents/THINK.md

## Problem

`SignalRouter` routes H2/H3 Hansei signals to `.arch/causal-signal.jsonl`. `arch report` shows a category breakdown. But THINK never synthesizes these into actionable recommendations. The pattern — "5 tasks in `1-code-reasoning` all declared [SpecDrift]" — is visible in the data but never surfaced as: "your specs are drifting during implementation. Consider adding a constraint-mapping step before ACs."

The signal system is write-only. It accumulates but never compounds.

## Proposed Solution

**THINK Phase 2 extension:** after Kaizen analysis, run Hansei pattern synthesis:

1. Read `.arch/causal-signal.jsonl` — filter for `hansei_signal:*` events from last 10 closed tasks
2. Group by category. For any category appearing ≥ 3 times (weak signal threshold):
   - Check if a TENSION document already exists in `docs/tensions/` for this pattern
   - If not: create `docs/tensions/TENSION-XXX.md` with the observed pattern, affected task IDs, proposed protocol change
   - If yes: append new evidence to existing TENSION
3. For any category appearing ≥ 5 times (strong signal): emit `[PATTERN-ALERT] [Category] detected in N tasks — systemic issue. See docs/tensions/TENSION-XXX.md` to `docs/INBOX.md`

This is the missing link between signal collection and protocol improvement.

**Separation of concerns:** synthesis is THINK Phase 2 (proposals only). It never modifies guidelines directly. Human promotes TENSION → guideline change.

## Constraint Axes
- Dependency ordering: Requires SignalRouter corpus (TASK-246 DONE) — valid now
- Temporal validity: Grows more valuable with corpus — start now
- Abstraction layer: Correct — THINK proposals only, no enforcement
- Observability validity: Deterministic aggregation + TENSION file creation
- Priority displacement: P1 — this is the moat condition mechanism

## Decision
PROMOTE → TASK-909
