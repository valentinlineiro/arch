# ADR-010: Escalation Maturity Phase 1 (Level 3 Detectable)

**Date:** 2026-05-06
**Status:** PROPOSED
**Deciders:** Gemini CLI

---

## Context
As the ARCH system moves toward higher autonomy (L3+), we need automated guards to detect when an agent is struggling, when a task is high-risk, or when the system protocol is being violated. Relying on human auditors for every step is a bottleneck, but relying on agent judgment alone leads to drift.

## Decision
Implement Phase 1 of the Escalation Maturity framework:
1. **Automated Muri Detection:** `arch next` will halt if the currently `IN_PROGRESS` task exceeds its size-based budget (turns or cost).
2. **Protected Path Enforcement:** `arch review` will flag modifications to `protectedPaths` that lack a corresponding NEW ADR in the same change set.
3. **Review Failure Detection:** `arch review` will flag tasks that have been rejected and returned to REVIEW, indicating a potential struggle or misalignment.

## Rationale
These automated triggers provide objective "Andon Cord" halts that don't rely on the agent's self-reporting, ensuring that high-risk or problematic states are escalated to the human INBOX immediately.

## Consequences
- **Positive:** Objective safety boundaries; reduced manual audit overhead for happy-path tasks; early detection of agent-task misalignment.
- **Negative:** Increased strictness might block legitimate work that requires "just-in-time" ADR writing (must now be committed/staged together).
- **Escalation:** All triggers write to `docs/INBOX.md` and halt the autonomous loop.
