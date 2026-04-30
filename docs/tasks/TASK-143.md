## TASK-143: Define Andon Cord halt conditions in DO.md and GOVERNANCE.md
**Meta:** P0 | S | READY | Focus:yes | 6-writing | local | docs/agents/DO.md, docs/GOVERNANCE.md, docs/INBOX.md
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Add Andon Cord section to `DO.md` defining three halt conditions: (1) `arch review` fails 3 consecutive times on the same task, (2) task turn count exceeds Muri threshold for its size, (3) implementation requires touching a protected path or triggering a MAJOR change.
- [ ] Define stop behavior: halt → append typed `ANDON_HALT` entry to `docs/INBOX.md` with condition + evidence → exit. Resume only on human `APPROVE` or `REDIRECT`.
- [ ] Add `ANDON_HALT` as a recognized entry type in GOVERNANCE.md escalation section.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
