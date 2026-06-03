# IDEA: Remove AlertFatigueStore — superseded by EscalationStore upsert

**Status:** PROMOTED
**Created:** 2026-06-03
**Source:** Code audit — AlertFatigueStore was deduplication machinery, now redundant
**Candidate-class:** 2-code-generation
**Candidate-size:** XS
**Depends:** none
**Decision:** Pending human review.

## Problem

AlertFatigueStore exists to suppress repeated escalations. EscalationStore.append() upsert semantics (TASK-1081) already handles deduplication — if an OPEN record for (type, subject) exists, it updates in-place instead of appending. AlertFatigueStore is now a second deduplication mechanism solving a problem the first one already solves. Dead code risk: both mechanisms may produce conflicting behavior.

## Decision
PROMOTE → TASK-1099
