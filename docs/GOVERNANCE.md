# GOVERNANCE.md
<!-- ARCH Framework | Autonomy & Decision Matrix -->

This document establishes the governance contract between the ARCH Agent and the Human. It defines who holds authority for various types of decisions.

## Decision Matrix

| Category | Decider | Protocol |
|-----------|---------|-----------|
| **Execution of READY Tasks** | **System** | Standard DO cycle |
| **Pull Request Creation** | **System** | Atomic commits |
| **Kaizen Proposals (IDEA)** | **System** | THINK mode → refinement/ |
| **Bug/Drift Detection** | **System** | Auto-registration in tasks/ |
| **Promote IDEA → READY** | **Human** | Explicit instruction |
| **Merge PR to Main** | **Human** | Code Review |
| **Guideline Modification** | **Human** | Governance Review |
| **Architectural Changes** | **H + J** | Requires prior ADR |
| **Add Dependencies** | **H + J** | Justification in PR |
| **Schema Changes** | **H + J** | Impact Validation |

**H + J:** Requires Human approval + documented technical Justification.

---

## Escalation (INBOX.md)

Any system action affecting a category that requires Human or Human+Justification approval, or that triggers an **Andon Cord halt**, will be automatically registered in `docs/INBOX.md` for periodic review.

Recognized entry types:
- `AWAITING_PROMOTION`: IDEA ready for backlog.
- `AWAITING_REVIEW`: Task ready for Auditor (see DO.md).
- `AWAITING_APPROVAL`: Manual gate required for specific actions.
- `ANDON_HALT`: Loop halted due to safety conditions (Review failure, Budget exceeded, or Protected Path).
- `ADR_REQUIRED`: Implementation requires a Decision Record.

### Human Triage Tokens
Humans respond to INBOX entries by writing a triage token inline or as a reply:
- `APPROVE`: Proceed with the proposed action or promotion.
- `REJECT: [reason]`: Cancel the proposed action or promotion with explanation.
- `DEFER`: Postpone the decision to a later session.
- `REDIRECT: [instruction]`: Override the current path with new instructions.

## Conflict Resolution

In case of ambiguity regarding a task's category, the system must default to escalation (requiring human approval).
