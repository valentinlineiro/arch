# IDEA: inbox-approval-gate-reads
**Meta:** Source: TASK-241-audit | Status: DRAFT | Size: S | Sessions: 1
**Decision:**

### Problem
Two automated processes still read `docs/INBOX.md` despite the TASK-241 invariant that INBOX.md must be a human-only projection artifact:

1. `sandbox-command.ts:59` — reads INBOX.md to detect whether the human wrote an `APPROVED | PRIVILEGED_EXECUTION | TASK-XXX` header, before allowing privileged execution.
2. `loop-engine.ts:323` (`handleResume()`) — reads INBOX.md to detect `ANDON_HALT` / `SPRINT_CHECKPOINT` headers and whether the human wrote `APPROVE` or `REDIRECT` inline.

Both are approval-gate reads: the system halts, the human writes a signal into INBOX.md, and the tool re-reads it to detect the response. The problem is that this couples the approval protocol to INBOX.md prose parsing, which is fragile and breaks the human-only invariant.

### Proposed direction
Replace the INBOX.md approval-gate reads with a structured approval channel:
- A new `.arch/approvals.jsonl` (or reuse `escalations.jsonl` with a new type) where the human writes a machine-readable approval record.
- `sandbox-command.ts` and `loop-engine.ts --resume` check this structured store instead of parsing INBOX.md headers.
- INBOX.md retains the human-readable prose entry for situational awareness but is no longer the authoritative gate signal.

### Constraint axes
- No dependency ordering violation — escalation-store.ts is now in place.
- No temporal validity issue — the data (approval signals) can be structured.
- Abstraction layer: the current INBOX.md parse is already at the wrong level; structured store is the right layer.
- No observability validity issue.
- No priority displacement — this is a correctness gap, not a polish concern.

### Open questions
- Should approvals live in `escalations.jsonl` (new status like `APPROVED`) or a separate file?
- Does `arch loop --resume` need a richer handshake (e.g., `arch approve <escalation-id>`) or is a simple file write sufficient?
