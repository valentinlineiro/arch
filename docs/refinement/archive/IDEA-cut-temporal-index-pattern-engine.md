# IDEA: Cut TemporalIndex + PatternEngine or make opt-in

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Code audit — pattern detection produces INBOX noise without calibrated thresholds
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

TemporalIndex detects repeated Hansei categories across sprints. PatternEngine fires when a category exceeds a threshold. Good idea in theory — catching "[TypeHack] on drift-checker.ts 4 times" is useful. In practice the thresholds are uncalibrated and the detection produces INBOX noise without actionable specificity.

The signal exists in the corpus — a human reading RETRO.md sees the same patterns. The automation adds noise before it adds value.

Options:
1. Remove both (simplest)
2. Move behind modules.patternDetection: enabled (off by default for minimal/standard profiles)
3. Keep but raise thresholds significantly and reduce INBOX verbosity

## Decision
PROMOTE → TASK-1101
