# IDEA: Cut or reduce CausalGraph to a simple log — arch trace is unused

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Code audit — CausalGraph 221 lines, arch trace not in default help, nobody uses it
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

CausalGraph (221 lines) stores task-to-ADR edges and Hansei-category-to-task links. arch trace exposes it. SignalRouter (H2/H3 Hansei routing) populates it on every task close. Nobody queries the graph — not govern, not review, not analyze. The Hansei corpus already contains the same information in human-readable form.

Two options:
1. Remove CausalGraph entirely — let the corpus be the graph
2. Reduce to a simple append-only JSONL log (no graph traversal, no SignalRouter) — keep the data, drop the machinery

## Decision
PROMOTE → TASK-1103
