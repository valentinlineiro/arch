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
