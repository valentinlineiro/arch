# IDEA: Archive 14 solved-and-sealed ADRs to docs/adr/archive/

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Protocol audit — 40% of ADRs are final decisions that don't need to be in active corpus
**Candidate-class:** 6-writing
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

36 ADRs in docs/adr/. ~14 are "solved and sealed" — the decision was made, implemented, and is no longer being revisited. Agents loading context for a new task don't need ADR-003 (dispatch ephemeral) or ADR-012 (exec bridge bugfixes) — those are historical record. Loading all 36 ADRs wastes context budget and makes the 7 truly load-bearing ADRs harder to find.

## Proposed solution

Move 14 sealed ADRs to docs/adr/archive/:
ADR-002, ADR-003, ADR-005, ADR-011, ADR-012, ADR-016, ADR-017, ADR-018, ADR-022, ADR-024, ADR-025, ADR-027, ADR-028, ADR-029

Keep 18 active ADRs in docs/adr/. Update AGENTS.md to only reference the active set.

Also deprecate (not archive) ADR-014, ADR-015, ADR-026 when the causal graph code is removed (depends on IDEA-remove-causal-graph).

## Validation hints

- docs/adr/ contains ≤ 20 files after archival
- The 7 load-bearing ADRs (001, 004, 009, 019, 020, 023, 034) remain in docs/adr/
- AGENTS.md ADR reference list updated
