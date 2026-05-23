## TASK-200: Implement arch task compress - lossy archive compression for Kaizen signal
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/archive/, cli/src/main/ts/
**Closed-at:** 2026-05-12T08:36:09.348Z
**Depends:** none

## Hansei
Straightforward M task, no blockers. Self-referential first AC (`test -f docs/archive/TASK-200.md`) cannot pass until the Auditor archives the task — noted in INBOX. Compression is pure text manipulation; chose to keep `**Depends:**` and `**Sprint:**` lines in compressed form since they are part of the canonical TASK-FORMAT and removing them could break parsers. Also compressed TASK-222 as a live example during implementation.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
