# IDEA: Compress IDENTITY.md from 276 to ~100 lines

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Protocol audit — scope boundaries should be crisp, not verbose
**Candidate-class:** 6-writing
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

IDENTITY.md is 276 lines for a document defining frozen scope boundaries. A governance constraint that takes 30 lines to explain is not a boundary — it's a policy debate. The re-entry index (§1–§8 navigation) is useful. The elaboration of each section is not. The document has grown by accretion — each new constraint added context to justify itself. The result is a document that agents load for context-window cost without proportional value.

## Proposed solution

Rewrite IDENTITY.md to ~100 lines:
- §1 Definition (frozen sentence): 3 lines
- §2 Scope Boundaries (inside/outside list): 15 lines
- §3 Invariants: 10 lines
- §4 Rejection Criteria: 10 lines
- §5 Current Priority Lock: 5 lines
- Re-entry index: 15 lines

Everything else either moves to the relevant ADR or is deleted.

## Validation hints

- IDENTITY.md is ≤ 110 lines after rewrite
- All load-bearing constraints still present
- Re-entry index still functional
