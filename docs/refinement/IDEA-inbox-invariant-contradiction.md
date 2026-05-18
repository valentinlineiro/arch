## IDEA: inbox-invariant-contradiction

**Status:** DRAFT
**Sessions:** 1
**Decision:** UNDECIDED

### Problem

Two contradictions in the INBOX.md protocol:

**1. Machine reads INBOX (AGENTS.md:120 vs code).**
`docs/AGENTS.md:120` states "automated processes must never read" INBOX. But:
- `cli/src/main/ts/application/use-cases/loop-engine.ts:350` reads INBOX to check for `SPRINT_CHECKPOINT` markers.
- `cli/src/main/ts/application/commands/next-command.ts:66` reads INBOX to check freshness.
- `docs/agents/DO.md:29` tells an Auditor session to read INBOX explicitly.

The protocol claims INBOX is a write-only human surface; the implementation treats it as a machine-readable control channel.

**2. git sync protocol contradicts itself (AGENTS.md:139 vs DO.md:7).**
`docs/AGENTS.md:139` forbids `git pull` and `git rebase` without explicit human approval. `docs/agents/DO.md:7` describes "if git pull --rebase encounters a conflict" as a normal execution path, implying agents are expected to run it.

### Proposed Fix

**For issue 1:** Decide which invariant is authoritative:
- Option A: Make INBOX truly write-only. Move `SPRINT_CHECKPOINT` and freshness signals to `.arch/escalations.jsonl` (already the structured store). Remove the two code reads.
- Option B: Downgrade the invariant to "agents must not act on INBOX state as a control signal" and update AGENTS.md accordingly.

**For issue 2:** Either remove the git pull/rebase guidance from DO.md, or add a carve-out in AGENTS.md for agent-initiated rebase when no conflict is expected (e.g., fast-forward only).

### Acceptance Criteria

- [ ] `docs/AGENTS.md` and `docs/agents/DO.md` agree on whether automated processes may read INBOX.
- [ ] The two code reads in loop-engine.ts and next-command.ts either comply with the invariant or the invariant is updated to permit them.
- [ ] git sync policy is stated without contradiction across AGENTS.md and DO.md.

### Decision-required: yes
