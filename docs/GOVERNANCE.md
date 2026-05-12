# GOVERNANCE.md
<!-- ARCH Framework | Autonomy & Decision Matrix -->

This document establishes the governance contract between the ARCH Agent and the Human. It defines who holds authority for various types of decisions.

<!-- Re-entry index — find the relevant section for the decision you're making:
     Introducing a new DriftChecker check or governance rule → §Governance Rule Introduction Protocol
     Handling a THINK signal about class boundary or degeneration  → §Governance Epistemological Boundary
     Deciding whether something is Class I or Class II             → §Canonical case (2026-05-12), then §Boundary
     Processing an INBOX escalation                               → §Escalation
     Responding to a governance stale or cross-rule signal        → §Terminal failure mode + §Boundary audit in THINK.md
     If re-reading this whole document feels necessary            → you're probably doing maintenance, not a decision;
                                                                    find the specific decision trigger above instead -->

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
<!-- Prior question (answer before reading — if you can state it, you can skip the section):
     "State one thing the automated governance layer can verify about a deletion,
      and one thing it cannot, even if all structural checks pass." -->

ARCH's governance layer operates across two distinct classes of decision. This distinction is not cosmetic — conflating them produces a system that optimizes for traceability instead of truth.

**Class I — Structurally evaluable:** Decisions reducible to deterministic checks (grep, build exit code, file existence, git log pattern, reference count). DriftChecker evaluates these. They verify structural consistency and traceability — not semantic correctness or intent.

**Class II — Non-mechanizable:** Decisions about architectural legitimacy, intent, and contextual justification. These cannot be reduced to automated checks without displacing interpretation into system design (where it becomes invisible and unauditable). Examples: whether a removal was the right architectural choice; whether an ADR captures the actual reasoning; whether a TENSION reflects a real invariant violation or a false alarm.

**What the boundary means in practice:**
- The automated layer can verify that a decision record *exists* (Class I). It cannot verify that the record is *correct* (Class II).
- These two claims must not be conflated. A system that treats "artifact exists" as equivalent to "decision was right" has hidden its interpretation inside tooling.
- Class II decisions require human-authored artifacts: REJECT fields, ADRs, TENSION records, weak signals. Absence of such an artifact triggers Class I escalation. Presence closes the Class I gate — regardless of artifact content.

**Canonical case (2026-05-12):** When the INTENT artifact was removed — `CaptureCommand`, `ThinkCommand`, `IntentRepository`, `MarkdownIntentRepository`, `ScaffoldTask`, `FinalizePromotion` — EscalationMaturity fired: "Last commit modifies protected path(s) without a new ADR." The removal was structurally complete: decision record existed (`IDEA-roadmap-arch-capture` archived with `REJECT:`), references cleaned, build passing, no orphan dependencies. The check could not distinguish this from a careless deletion. This case motivated the Class I/II distinction. When the distinction feels abstract, this case is what it's describing.

**Consequence:** ARCH's governance layer is epistemologically bounded. It enforces process and traceability; it does not adjudicate truth. Any governance rule that claims to evaluate legitimacy through mechanism alone is claiming more than it can deliver. Such rules should be scoped as "structural consistency check" or "traceability check" — not "legitimacy check."

**Boundary stability risk:** The Class I / Class II boundary is not fixed. It drifts when Class I checks accumulate heuristics that implicitly make Class II claims — each addition individually seems reasonable, the system does not break, but its nature changes silently. This is the primary long-term failure mode of ARCH's governance layer: not a crash, but a gradual slide into automated adjudication of decisions that should remain human.

## Governance Rule Introduction Protocol
<!-- Prior question (answer before reading — if you can state it, you can skip the section):
     "For the rule you're introducing: describe the specific scenario in which it returns PASS
      while the failure it was designed to catch is actually present." -->

Every new DriftChecker check or governance constraint must declare its class before being promoted to a task. This is a required section in any IDEA that proposes a governance rule. It is also a required section in any ADR that creates one.

**Required declaration:**

```
## Governance class
Class: I | II
Evaluates: [what the check actually measures — be narrow]
Does NOT evaluate: [explicit statement of what it cannot determine]
Boundary risk: [worked scenario — "If <specific thing happens>, this check would be making a Class II claim
                because <mechanism>. Concretely: an operator who reads <output> as <wrong conclusion>
                has crossed the boundary." Generic statements ("could drift toward Class II if heuristics
                are added") do not pass. Name the specific check behavior and the specific misreading.]
```

The `Boundary risk` field requires a worked scenario grounded in the actual rule's behavior — not a category statement. A generic sentence that could describe any governance rule does not pass. If the worked scenario cannot be completed without fabricating specifics, the rule's scope is not defined precisely enough to be introduced. This friction is intentional: it makes ritual compliance harder, not impossible. It does not guarantee genuine engagement. It should remain a TENSION candidate until its scope is defined precisely enough to name its own failure modes.

**Periodic boundary review (human obligation, not automated check):**

THINK Phase 2.5 includes a governance boundary audit: scan existing DriftChecker checks for evidence that their declared class no longer matches their actual behavior. If a Class I check is found to be implicitly making Class II claims (e.g., using commit message content as a proxy for intent, or file presence as a proxy for correctness), emit `[SEMANTIC-DRIFT] class-boundary-violation: <check-name> — declared Class I but evaluating: <claim>`. This is a THINK observation, not a DriftChecker failure. The audit is Class II itself — it requires human interpretation to evaluate whether drift has occurred.

The protocol is intentionally not automated. Automating the boundary review would itself be an instance of the failure it is designed to prevent.

**Terminal failure mode: protocol degeneration**

The introduction protocol is subject to its own version of the failure it was designed to prevent. A `Does NOT evaluate` field filled with plausible-sounding but generic language ("does not evaluate semantic correctness") is formally complete and conceptually empty. The form passes; the discipline is absent. This cannot be detected by structural checks — it requires evaluating whether a claim was made with genuine analysis or with ritual compliance. That is irreducibly Class II.

Two surface-level proxies make degeneration visible without claiming to measure it:

1. **Cross-rule repetition**: If `Does NOT evaluate` statements across multiple governance rules are textually similar, at least one may be templated rather than discovered. THINK Phase 2.5 surfaces this as a signal for human re-examination — not a violation, not an automated judgment.

2. **Rule longevity**: A governance rule whose class assignment has not been re-examined against actual system behavior in 6+ months may have drifted from its declared class without anyone noticing. THINK Phase 2.5 surfaces rules past this threshold.

Neither proxy is reliable. Both can be satisfied with ritual compliance. The honest position: beyond these proxies, protocol integrity requires periodic fresh engagement with first principles — not "does the form say the right thing?" but "is the system actually doing what the form claims?" No mechanism can substitute for this. Naming this as an open limit is more useful than adding a third proxy layer.

## Conflict Resolution

In case of ambiguity regarding a task's category, the system must default to escalation (requiring human approval).
