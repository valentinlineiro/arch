# IDEA: Machine-readable halt policy (HALT.md)
**Created:** 2026-05-05
**Source:** Codex external review — "one machine-readable halt policy; if model misunderstands, does system halt safely or quietly drift?"
**Status:** DRAFT
**Sessions:** 1
**Meta:** P2 | S | local | docs/, cli/src/main/ts/

## Problem
Halt conditions are currently scattered across DO.md prose (lock staleness, predicate failure, AC blocks, escalation triggers). A model must read and synthesize multiple docs to know when to stop. Weak models drift instead of halting — they continue past failure conditions because the stop signal is not explicit enough. The system should fail closed, not drift.

## Proposed solution
Create `docs/HALT.md`: a structured table mapping each halt condition to a CLI exit code and a required INBOX entry. Example:

| Condition | Trigger | CLI exit | INBOX entry |
|---|---|---|---|
| No actionable task | `arch next` exits 1 | 1 | `HALT: no READY tasks` |
| Predicate failure | `arch task review` exits 1 | 1 | `HALT: predicate failed TASK-XXX` |
| Stale lock > 3 days | `arch next` detects | 1 | `HALT: stale lock TASK-XXX` |
| Blocked task at top | `arch next` detects | 1 | `HALT: blocked TASK-XXX` |
| Unchecked ACs at close | `arch task review` | 1 | `HALT: unchecked ACs TASK-XXX` |

Every halt condition maps to a non-zero CLI exit so the loop (`arch loop`) can detect and surface it without requiring the model to interpret prose. `arch review` gains a check that HALT.md exists and that every halt condition named in DO.md is present in the table.

## Dependencies
- TASK-193 (`arch next`) implements several of these halt conditions
- IDEA-arch-core-contract references HALT.md in its step 4

## Estimated size
S — doc authoring, one new `arch review` drift check, no new commands

## Gaps
- `arch review` completeness check: HALT.md should be authoritative (not cross-verified against DO.md prose). Check verifies file exists and table is structurally valid.
- Halt entries should go to `docs/HALT-LOG.md` (append-only), not INBOX.md, to avoid write conflicts with THINK regeneration.
- Dependency on TASK-193 is soft — doc and drift check can be done independently; TASK-193 implements some conditions but doesn't block this IDEA.

## Decision
<!-- Human writes here after THINK evaluation -->
