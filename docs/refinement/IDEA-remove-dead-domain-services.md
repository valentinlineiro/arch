# IDEA: Remove 0-caller domain services — dead speculative code

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Code audit — 5 domain services with 0 callers totaling 519 lines
**Candidate-class:** 2-code-generation
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

Five domain services exist with zero callers in production code:
- decision-impact-engine.ts (229 lines)
- decision-reconciliation-engine.ts (99 lines)
- epistemic-integrity-service.ts (90 lines)
- subsystem-clusterer.ts (58 lines)
- role-inference-engine.ts (43 lines)

Total: 519 lines of dead code. Built speculatively, never wired. Add maintenance surface, inflate test surface expectations, confuse new contributors.

## Decision
