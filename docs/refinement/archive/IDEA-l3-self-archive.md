# IDEA: L3 Self-Archive — audited autonomous task completion

**Created:** 2026-05-06
**Source:** Human — strategic analysis of ARCH operational friction
**Status:** PROMOTED → TASK-208
**Sessions:** 1

## Problem

Every task completion requires a human Auditor to verify ACs and move the file to `docs/archive/`. This creates a throughput bottleneck: the agent finishes work, then velocity drops to zero while waiting for human archival. For XS/S tasks with high-confidence AC verification, this is pure overhead.

## Proposed Solution

Extend DO.md and `MarkTaskDone` to allow self-archive under strict conditions:

**L3 gate (all must pass):**
1. `arch review` exits 0
2. `SemanticACVerifier` returns `pass: true` with confidence `high`
3. Task size is XS or S

**On L3 self-archive:**
- Agent archives the task file to `docs/archive/` (currently forbidden in DO.md)
- Writes an `AWAITING_REVIEW | TASK-XXX` entry to `docs/INBOX.md` with the verifier's evidence — human can inspect and revert if wrong
- Commits with `done: [TASK-XXX] <title> [L3-AUTO]` tag for audit trail

**Fallback:** If verifier confidence is `medium` or `low`, write `AWAITING_REVIEW` to INBOX and stop — human audits as today.

**Governance change required:** ADR documenting the boundary shift (L2 → L3 for XS/S), update to DO.md, update to CLAUDE.md hard limits section.

## Dependencies

- TASK-199 (LLM bridge) — **DONE**
- IDEA-semantic-ac-verification — **must be promoted and implemented first**

## Estimated Size

M — ADR + DO.md + CLAUDE.md + MarkTaskDone + integration tests

## Gaps

- Revert mechanism: if human disagrees with auto-archive, what's the recovery path? (move back to `docs/tasks/` with READY status — needs a `arch revert-task TASK-XXX` command or manual)
- "L3-AUTO" tasks should be excluded from Hansei reflection (they're low-risk by definition) — or should they be included for learning signal?

---

**Decision:**
**Promoted by:**
**Promoted on:**
