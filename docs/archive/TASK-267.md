## TASK-267: Fix malformed meta lines in docs/archive/ and add pre-archive guard
**Meta:** P1 | S | DONE | Focus:no | 7-operations | claude | docs/archive/
**Closed-at:** 2026-05-19T12:48:54.872Z

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** AC1 was already satisfied before work began — `ArchiveMetaIntegrity` drift check already passes against all archive files. No empty size fields exist. The original incident (empty size fields in archive) was fixed by a prior task. The real gap was AC2: no pre-archive guard in `archiveFile()` to block a malformed meta line from being archived in the first place. `validateMetaLineFormat()` added to `govern-system.ts` validates Priority (P0-P3), Size (XS/S/M/L/XL), and Status presence before any archive move.
**Constraint:** The drift check (`ArchiveMetaIntegrity`) validates what is already in the archive. The pre-archive guard (`validateMetaLineFormat`) validates what is about to enter the archive. Both layers are now present. Pre-existing tasks that somehow bypassed the drift check would still be caught on re-archive attempts.
**Cost:** One session. Investigation took longer than implementation because the archive was already clean — the task's original premise (malformed meta lines needing backfill) was stale.
**Forward Action:** IDEA-verify-pre-existing-before-start — pattern recurs: task describes a problem that was already fixed. Agents should verify the error condition still exists before implementing the fix.
