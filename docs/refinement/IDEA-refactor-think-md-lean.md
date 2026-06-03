# IDEA: Refactor THINK.md — separate core steps from edge-case clauses

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Protocol audit — THINK.md steps have become dense with exception clauses
**Candidate-class:** 6-writing
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

THINK.md Phase 1 step 3 alone has: the rule, the exception for queue backlog, the replenishment cap, the INBOX entry requirement, the ADR-034 prefix requirement, and the floor-breach visibility rule — six sub-rules on one step. This pattern repeats across steps. The document was 40 lines when first written. It's 134 lines now. An agent loading THINK.md for a reflection session has to parse dense compound instructions.

## Proposed solution

Restructure THINK.md:
1. Core steps (lean): what to do, in order, one sentence per step — target 50 lines
2. Edge case appendix: all the "unless X", "except when Y", "in the case of Z" clauses — can be 80 lines, but separated from the core

An agent reading quickly gets the core steps. An agent in an edge case situation reads the appendix for their specific case.

## Validation hints

- THINK.md core steps section ≤ 55 lines
- All existing rules preserved in the edge case appendix
- arch analyze still works correctly (behavior unchanged)
