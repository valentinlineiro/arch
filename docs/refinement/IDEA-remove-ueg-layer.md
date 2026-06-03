# IDEA: Remove UEG analysis layer — 1 caller, 0 downstream consumers

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Code audit — UEG layer called by analyze-command but output unused
**Candidate-class:** 2-code-generation
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

The Unified Entity Graph (ueg-analysis-layer.ts, ueg-ir-builder.ts, ueg-interfaces.ts — 190 lines total) is called by analyze-command.ts but its output is never consumed downstream. The graph is built and discarded. The architectural intent (model repo structure as typed graph) was sound but never completed. Carrying 190 lines of infrastructure for a feature that produces no output.

## Decision
PROMOTE → TASK-1098
