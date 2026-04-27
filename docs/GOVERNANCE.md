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

Any system action affecting a category that requires Human or Human+Justification approval will be automatically registered in `docs/INBOX.md` for periodic review.

## Conflict Resolution

In case of ambiguity regarding a task's category, the system must default to escalation (requiring human approval).
