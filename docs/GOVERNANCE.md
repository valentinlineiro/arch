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

## Governance Epistemological Boundary

ARCH's governance layer operates across two distinct classes of decision. This distinction is not cosmetic — conflating them produces a system that optimizes for traceability instead of truth.

**Class I — Structurally evaluable:** Decisions reducible to deterministic checks (grep, build exit code, file existence, git log pattern, reference count). DriftChecker evaluates these. They verify structural consistency and traceability — not semantic correctness or intent.

**Class II — Non-mechanizable:** Decisions about architectural legitimacy, intent, and contextual justification. These cannot be reduced to automated checks without displacing interpretation into system design (where it becomes invisible and unauditable). Examples: whether a removal was the right architectural choice; whether an ADR captures the actual reasoning; whether a TENSION reflects a real invariant violation or a false alarm.

**What the boundary means in practice:**
- The automated layer can verify that a decision record *exists* (Class I). It cannot verify that the record is *correct* (Class II).
- These two claims must not be conflated. A system that treats "artifact exists" as equivalent to "decision was right" has hidden its interpretation inside tooling.
- Class II decisions require human-authored artifacts: REJECT fields, ADRs, TENSION records, weak signals. Absence of such an artifact triggers Class I escalation. Presence closes the Class I gate — regardless of artifact content.

**Consequence:** ARCH's governance layer is epistemologically bounded. It enforces process and traceability; it does not adjudicate truth. Any governance rule that claims to evaluate legitimacy through mechanism alone is claiming more than it can deliver. Such rules should be scoped as "structural consistency check" or "traceability check" — not "legitimacy check."

**Boundary stability risk:** The Class I / Class II boundary is not fixed. It drifts when Class I checks accumulate heuristics that implicitly make Class II claims — each addition individually seems reasonable, the system does not break, but its nature changes silently. This is the primary long-term failure mode of ARCH's governance layer: not a crash, but a gradual slide into automated adjudication of decisions that should remain human.

## Governance Rule Introduction Protocol

Every new DriftChecker check or governance constraint must declare its class before being promoted to a task. This is a required section in any IDEA that proposes a governance rule. It is also a required section in any ADR that creates one.

**Required declaration:**

```
## Governance class
Class: I | II
Evaluates: [what the check actually measures — be narrow]
Does NOT evaluate: [explicit statement of what it cannot determine]
Boundary risk: [what would need to happen for this check to start making Class II claims — name the specific heuristic creep path]
```

If a proposed check cannot complete the `Does NOT evaluate` and `Boundary risk` fields without vagueness, it is not ready to be a Class I rule. It should remain a TENSION candidate until its scope is defined precisely enough to name its own failure modes.

**Periodic boundary review (human obligation, not automated check):**

THINK Phase 2.5 includes a governance boundary audit: scan existing DriftChecker checks for evidence that their declared class no longer matches their actual behavior. If a Class I check is found to be implicitly making Class II claims (e.g., using commit message content as a proxy for intent, or file presence as a proxy for correctness), emit `[SEMANTIC-DRIFT] class-boundary-violation: <check-name> — declared Class I but evaluating: <claim>`. This is a THINK observation, not a DriftChecker failure. The audit is Class II itself — it requires human interpretation to evaluate whether drift has occurred.

The protocol is intentionally not automated. Automating the boundary review would itself be an instance of the failure it is designed to prevent.

## Conflict Resolution

In case of ambiguity regarding a task's category, the system must default to escalation (requiring human approval).
