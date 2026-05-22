# GOVERNANCE.md
<!-- ARCH Framework | Autonomy, Decision Matrix & Epistemic Frame -->

This document establishes the governance contract between the ARCH Agent and the Human. It defines who holds authority for various types of decisions and the constitutional doctrine anchoring all automation.

<!-- Re-entry index — find the relevant section for the decision you're making:
     Introducing a new DriftChecker check or governance rule → §Governance Rule Introduction Protocol
     Handling a THINK signal about class boundary or degeneration  → §Governance Epistemological Boundary
     Deciding whether something is Class I or Class II             → §Canonical case (2026-05-12), then §Boundary
     Processing an INBOX escalation                               → §Escalation
     Responding to a governance stale or cross-rule signal        → §Terminal failure mode + §Boundary audit in THINK.md
     If re-reading this whole document feels necessary            → you're probably doing maintenance, not a decision;
                                                                    find the specific decision trigger above instead -->

## Epistemic Frame

### Core Principle
> ARCH exists to externalize procedural discipline without externalizing epistemic responsibility.

This is the load-bearing constraint. Any automation that violates it is unconstitutional regardless of whether it passes `arch check`. ARCH must distinguish between **Bureaucratic friction** (overhead to be eliminated) and **Constructive friction** (overhead that protects decision quality and must be preserved).

### Anti-Goals
Systems decay toward unnamed failure modes. These must be resisted:
- **Ceremonial oversight:** Humans review machine outputs without genuine deliberation.
- **Recommendation ratification:** Human "approval" becomes rubber-stamping.
- **Silent authority transfer:** Practical decision authority shifts to the machine without formal policy change.
- **Governance-by-inertia:** Decisions made by timeout or absence of objection rather than choice.
- **Confidence laundering:** Machine scores substitute for human judgment about novelty.
- **Veto-default constitutionalism:** Approval becomes the expected outcome; veto becomes "costly" to exercise.

### Governance Layer Model
1.  **Layer 1 — Constitutional:** Defines invariants and authority boundaries. This section.
2.  **Layer 2 — Semantic:** Compresses cognition (precedent indexing, novelty scoring). Inputs to human adjudication.
3.  **Layer 3 — Operational:** Expresses work (AC templates, Hansei serialization).
**The Asymmetry Warning:** Layer 3 without Layer 2 makes the system procedurally efficient but epistemically blind to drift.

### Constitutional Invariants
1.  **Humans own novelty adjudication.** Machines may score novelty; they do not adjudicate it.
2.  **Humans own topology mutation.** Changes to governance checks require human authorization.
3.  **Humans own precedent creation.** The first instance of a decision pattern is always human-made.
4.  **Machines may prepare but not legitimize governance.** THINK proposals are preparation; human decisions are legitimization.
5.  **Human disagreement must remain operationally legitimate and low-friction.** Accepting a recommendation must not be structurally cheaper than rejecting it.

---

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

---

## Governance Epistemological Boundary

ARCH's governance layer operates across two distinct classes of decision.

**Class I — Structurally evaluable:** Decisions reducible to deterministic checks (DriftChecker). They verify structural consistency and traceability — not semantic correctness or intent.

**Class II — Non-mechanizable:** Decisions about architectural legitimacy, intent, and contextual justification. These require human-authored artifacts (REJECT fields, ADRs, TENSION records).

**The Boundary Rule:** The automated layer can verify that a decision record *exists* (Class I). It cannot verify that the record is *correct* (Class II). Conflating these displacement interpretation into system design, where it becomes invisible and unauditable.

---

## Governance Rule Introduction Protocol

Every new DriftChecker check or governance constraint must declare its class.

**Required declaration:**
```
## Governance class
Class: I | II
Evaluates: [what the check actually measures]
Does NOT evaluate: [explicit statement of what it cannot determine]
Boundary risk: [worked scenario naming specific check behavior and misreading]
```

**Periodic boundary review:** THINK Phase 2.5 includes a governance boundary audit to detect if Class I checks are implicitly making Class II claims (Semantic Drift).

---

## Conflict Resolution

In case of ambiguity regarding a task's category, the system must default to escalation (requiring human approval).
