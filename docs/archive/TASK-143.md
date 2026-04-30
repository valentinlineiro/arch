## TASK-143: Define Andon Cord halt conditions in DO.md and GOVERNANCE.md
**Meta:** P0 | S | DONE | Focus:no | 6-writing | local | docs/agents/DO.md, docs/GOVERNANCE.md, docs/INBOX.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [x] Add Andon Cord section to `DO.md` defining three halt conditions: (1) `arch review` fails 3 consecutive times on the same task, (2) task turn count exceeds Muri threshold for its size, (3) implementation requires touching a protected path or triggering a MAJOR change.
- [x] Define stop behavior: halt → append typed `ANDON_HALT` entry to `docs/INBOX.md` with condition + evidence → exit. Resume only on human `APPROVE` or `REDIRECT`.
- [x] Add `ANDON_HALT` as a recognized entry type in GOVERNANCE.md escalation section.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
