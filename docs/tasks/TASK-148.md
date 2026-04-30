## TASK-148: Formalize INBOX.md as primary governance surface
**Meta:** P1 | M | READY | Focus:no | 7-operations | local | docs/INBOX.md, docs/GOVERNANCE.md, docs/agents/THINK.md, docs/agents/DO.md
**Sprint:** sprint/v0.7-foundations
**Depends:** TASK-143

### Acceptance Criteria
- [ ] Add INBOX regeneration as the final step of THINK Phase 1: overwrite `docs/INBOX.md` with loop status, active/READY task counts, pending items by type (`AWAITING_PROMOTION`, `AWAITING_REVIEW`, `ANDON_HALT`), and last 5 completed task summaries. Commit with `[THINK]` tag.
- [ ] Define the DO write protocol: any action hitting a human-approval gate appends a timestamped, typed entry to INBOX before halting. Document the format in `DO.md`.
- [ ] Define human triage tokens: `APPROVE`, `REJECT: reason`, `DEFER` — document in GOVERNANCE.md.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
