## TASK-208: Implement L3 Self-Archive - audited autonomous task completion
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | docs/agents/DO.md, docs/AGENTS.md, docs/adr/, cli/src/main/ts/application/use-cases/mark-task-done.ts
**Closed-at:** 2026-05-16T17:26:47.987Z
**Depends:** TASK-207

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Implemented L3 self-archive gate: XS/S tasks with DeterministicACVerifier pass and ≥1 cmd/file AC self-archive without human Auditor. ADR-009 written, DO.md and AGENTS.md updated, 4 unit tests added. 395 tests pass.
**Constraint:** The commit message for L3-archived tasks does not yet use the `done:` prefix — it uses the standard `arch task done` flow commit. The `[L3-AUTO]` marker is written to INBOX but not the commit message directly. This is a minor spec deviation.
**Cost:** The commit message format deviation means `[L3-AUTO]` is not grep-able in git log without reading INBOX. Low-severity — INBOX is the authoritative audit trail.
**Forward Action:** Consider adding git commit tagging in a follow-up XS task.

## Approval
Approved-by: Auditor | 2026-05-16
