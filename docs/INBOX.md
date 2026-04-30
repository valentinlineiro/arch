# INBOX
<!-- ARCH v0.6.0 | System Governance Dashboard -->

## [2026-04-30] Loop Status: ACTIVE
- **READY:** 4
- **IN_PROGRESS:** 1 (TASK-097)
- **REVIEW:** 0
- **DONE (Last 5):**
  - chore: start [TASK-097] [DO] (00c498f)
  - idea: register loop observability and security improvements (336d6cc)
  - feat: implement stale lock detection in arch review (Aligns with ADR-001) [TASK-137] (7fc5201)
  - chore: [TASK-097] focus task via arch govern (018141f)
  - chore: archive [TASK-137] DONE [TASK-137] [THINK] (cd98591)

## Pending Items
- **AWAITING_REVIEW:** IDEA-improve-loop-observability.md
- **AWAITING_PROMOTION:** none
- **ANDON_HALT:** none

## System Health
- **Integrity:** arch review OK
- **Replenishment:** 4 READY tasks (above threshold)
- **Stale Locks:** none detected (check v0.6.1 active)

## [2026-04-30 11:52] ANDON_HALT | TASK-097
Evidence: arch exec exited with code 130

## [2026-04-30 12:04] ANDON_HALT | TASK-156
Evidence: arch exec exited with code 1

## [2026-04-30 14:20] REVIEW_REQUEST | TASK-156
AC:
- Reviewer/ReviewSystem enforce AC completion for active tasks in `DONE` and `REVIEW`.
- `arch review` fails when those tasks still contain unchecked `- [ ]` items.
- Review logic remains compatible with the existing `scripts/arch.sh task done` shell guard.
- `arch review` passes after task handoff commit.
Changed files:
- cli/src/test/ts/reviewer.test.ts
- cli/src/test/ts/review-system.test.ts
- docs/tasks/TASK-156.md
