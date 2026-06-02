# IDEA: THINK should cross-check PROMOTED IDEA Decision fields against referenced task titles

**Status:** DRAFT
**Created:** 2026-05-27
**Source:** smartcart-os THINK Phase 3 — IDEA-auth had `Decision: PROMOTE → TASK-018` but TASK-018 was an onboarding fix, not an auth task; mismatch went undetected
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** none

## Problem

When a PROMOTED IDEA's `Decision: PROMOTE → TASK-XXX` field references a task whose title does not match the IDEA's intent, no mechanism detects the mismatch. THINK treats the Decision as resolved and moves on. The IDEA is marked PROMOTED against the wrong task, corrupting the traceability graph.

Note: Change 1 of the originating IDEA (system-commit exemption for THINK/GOVERN) is already covered by TASK-1084.

## Proposed fix

Add to `docs/agents/THINK.md` Phase 1:

> For each IDEA with `Decision: PROMOTE → TASK-XXX`, verify the referenced task exists and its title plausibly matches the IDEA's intent (keyword overlap ≥ 1 non-stopword). If the task does not exist or the title is implausible, append a `[DATA-INTEGRITY-ALERT]` to INBOX and do not treat the IDEA as resolved.

## Acceptance Criteria

- [ ] `docs/agents/THINK.md` Phase 1 updated with Decision Integrity cross-check rule
- [ ] INBOX receives `[DATA-INTEGRITY-ALERT]` when PROMOTE target title is implausible
- [ ] `arch review` passes

## Sessions: 1

## Decision

