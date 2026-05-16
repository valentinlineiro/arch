# IDEA: fix-phase-naming-drift
**Created:** 2026-05-13
**Source:** Phase-2.5
**Status:** REJECTED
**Sessions:** 0
**Meta:** P3 | XS | docs/adr/ADR-013-two-tier-drift-detection.md, docs/agents/THINK.md

## Problem
ADR-013 references "THINK Phase 3.5" for semantic drift analysis. However, `docs/agents/THINK.md` implements this as "Phase 2.5". This discrepancy creates confusion about the protocol's structure and makes ADR-013 look outdated or the implementation look deviant.

## Proposed solution
Align terminology. Update ADR-013 to reference Phase 2.5, or update THINK.md to use Phase 3.5. Given Phase 2 is refinement and Phase 3 is Kaizen, Phase 2.5 (Observer) sits logically between them as it feeds both.

## Governance class
Class: I
Evaluates: Textual consistency between ADR and documentation.
Does NOT evaluate: Semantic correctness of the phase ordering.

## Decision

## Decision
REJECT: Already fixed in session 2026-05-16. ADR-013 now correctly references Phase 2.5 (Semantic Drift Analysis) throughout.
