## TASK-961: Fix archive parser to skip non-DONE tasks: add status filter
**Meta:** P1 | XS | DONE | Focus:no | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-20T13:10:00Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** Duplicate of TASK-926. The status filter (lines 51-53 of archive-parser.ts) was added by TASK-926 on 2026-05-18, one day before this task was filed. Discovery made during TDD pre-flight: archive-parser.ts already contained `if (statusField !== 'DONE') continue;`. No non-DONE files exist in docs/archive/. No code change required.
**Constraint:** None — task was obsolete at creation time.
**Cost:** One investigation cycle to confirm the prior fix was complete and correct.
**Forward Action:** None required.
