## TASK-142: Decouple reviewer from executor — Auditor role with clean context
**Meta:** P0 | S | DONE | Focus:no | 7-operations | claude | docs/agents/DO.md, docs/INBOX.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [x] Add a protocol rule to `DO.md`: the agent that locks and implements a task cannot be the same agent that archives it. It must yield to an Auditor.
- [x] Define the handover format: DO writes a `REVIEW_REQUEST` entry to `docs/INBOX.md` (task ID + AC list + changed files) before releasing the lock.
- [x] Define the Auditor step: a fresh session reads INBOX, runs `arch review`, checks each AC against actual repo state, writes `REVIEW_PASS` or `REVIEW_FAIL` back to INBOX.
- [x] DO does not set status to DONE until INBOX shows `REVIEW_PASS` for the task.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
