# IDEA: Define and instrument ontological friction measurement
**Created:** 2026-05-25
**Source:** Human structural review
**Status:** DRAFT
**Meta:** P1 | L | local | docs/refinement/

## Problem
The core design principle is "net friction reduction," but there is no instrumentation to measure ontology cost vs friction saved. The system trusts its own design axiom without empirical validation. When complexity grows faster than friction savings, there is no alert. The principle is load-bearing — it justifies the system's existence — but it is operationally undefined. This is a foundational epistemic gap that compounds as the system grows.

## Proposed solution
First: define "friction" operationally before instrumenting it. Candidate dimensions: (1) task cycle time from READY to DONE, (2) human decision latency at promotion gate, (3) arch review violation frequency per sprint, (4) number of manual corrections to machine-generated artifacts. Then: baseline these metrics against a pre-ARCH control period using git history. Then: instrument and trend. The output is not a dashboard — it is a falsifiability condition: if metrics do not improve over N sprints, the system's design axiom is empirically challenged.

## Dependencies
- IDEA-reflect-independence-measurement (shares measurement infrastructure concern)
- Requires ≥3 sprints of instrumented history before meaningful trend is visible

## Estimated size
L

## Gaps

## Decision
REJECT. The falsifiability condition cannot be established without a control population. Zero external users means every metric (cycle time, decision latency, violation frequency) reflects the author's usage patterns — endogenous measurement with no counterfactual. The P0|L priority classification was applied before any acquisition happened, which inverts the measurement problem: you can't baseline what you haven't yet changed. If the 90-day sprint produces external users, this IDEA should be re-filed from scratch with real baseline data and a real control group, not promoted from this draft.
