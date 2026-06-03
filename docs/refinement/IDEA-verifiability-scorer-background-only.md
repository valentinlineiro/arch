# IDEA: VerifiabilityScorer should stay background-only — remove from all output paths

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Code audit — scorer runs but output was suppressed in TASK-1074; still adds noise in some paths
**Candidate-class:** 2-code-generation
**Candidate-size:** XS
**Depends:** none
**Decision:** Pending human review.

## Problem

VerifiabilityScorer scores AC predicates (cmd > file > prose). TASK-1074 suppressed it from capture output. But it may still appear in arch review output or other paths. The scores were almost never acted on by humans or agents — nobody changed their ACs based on a verifiability score. The quality signal is real but the output is noise at current calibration.

Proposed: keep the scorer running as an internal metric (corpus quality audit can use it) but remove it from all terminal output paths permanently.

## Decision
