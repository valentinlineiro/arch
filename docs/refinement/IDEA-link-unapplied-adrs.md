# IDEA: Formalize implementation record for ADR-008 and ADR-013
**Created:** 2026-05-12
**Source:** Phase-4 Kaizen
**Status:** DRAFT
**Sessions:** 1
**Meta:** P3 | XS | writing | docs/adr/

## Problem
`arch review` reports that `ADR-008` (Centralize halt conditions) and `ADR-013` (Two-tier drift detection) are ACCEPTED but never referenced in any task file. This suggests they were implemented without being tracked in the formal task lifecycle, or the tracking reference was missed.

## Proposed solution
Create a small "administrative" task to verify the implementation of these ADRs against their stated decisions and add the `ADR-XXX` reference to the task file's `Meta` or `Implementation` section to satisfy the `UnappliedADRs` check.

## Rationale
Maintains the integrity of the ADR-to-Task causal graph.

## Decision
<!-- Human writes here after THINK evaluation -->
