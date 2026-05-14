# ADR-019: Constitutional Hansei Ontology

**Date:** 2026-05-14
**Status:** PROPOSED
**Deciders:** Human Architect, Gemini CLI

---

## Context
The current Hansei (retrospective) implementation in ARCH is narrative prose appended at the end of a task. It relies on the implementing agent's virtue to admit mistakes rather than structural enforcement. This leads to post-hoc rationalization, "roleplay" retrospectives ("I could have been clearer"), and hides technical debt. Hansei is currently a "metrical footnote" rather than a "constitutional gate," making it impossible to systematically route architectural pain into governance or the causal graph. We need to formalize Hansei's ontology—severity levels, controlled vocabulary, and escalation policies—before implementing validation rules.

## Decision
We redefine Hansei as a mandatory, structured diagnostic tool evaluated during the `arch review` phase. It is governed by a strict ontology with automated escalation paths. A task cannot move to `DONE` without a structurally valid Hansei. 

Hansei must follow this exact schema:
```markdown
## Hansei
**Severity:** [H0|H1|H2|H3]
**Category:** [Controlled Vocabulary]
**Decision:** [The specific technical or process compromise made.]
**Constraint:** [The pressure or missing info that forced the compromise.]
**Cost:** [The specific debt or risk introduced.]
**Forward Action:** [Link to an IDEA, escalation, or specific cleanup task, if applicable.]
```

### 1. Severity Levels (Constitutional Impact)
Severity measures architectural impact, not emotional gravity.

*   **H0 — Observation:** No actual debt. A note on optimization or preference. Generates no mandatory action.
*   **H1 — Localized Debt:** Contained compromise (e.g., a messy inline function). Does not alter architecture or induce repetition. Resolved opportunistically.
*   **H2 — Systemic Friction:** A repeating problem revealing poor system ergonomics (e.g., constantly fighting the type checker in a specific module). Must generate an obligatory `IDEA`.
*   **H3 — Constitutional Breach:** Violates core ARCH operating principles (e.g., integrity, provenance, fail-closed, auditability). This is invalidity, not just debt. Blocks closure.

### 2. Controlled Vocabulary (Categories)
Categories are strictly limited to the following closed list. Extension requires a new ADR.

*   **Technical:** `[TypeHack]`, `[LeakyAbstraction]`, `[DeferredTest]`, `[ContextWaste]`, `[SymbolDiscovery]`, `[HiddenDependency]`, `[SpecDrift]`
*   **Process:** `[ProcessViolation]`, `[PrematureOptimization]`, `[ReviewBlindspot]`, `[MissingDecisionRecord]`
*   **Constitutional:** `[ProvenanceBreak]`, `[IntegrityCorruption]`, `[FailOpenBehavior]`, `[AuditGap]`

### 3. Automated Escalation Policy
Severity directly maps to automated system consequences enforced by `arch review`.

| Severity | Mandatory Consequence |
| :--- | :--- |
| **H0** | None. Tracked for long-term metadata. |
| **H1** | Tracked in task history. (Optionally flagged for next relevant cleanup). |
| **H2** | **IDEA Required.** An IDEA task must be linked in the "Forward Action" field. |
| **H3** | **REVIEW Reject + Escalation.** `arch review` fails immediately. An `ANDON_HALT` or `.arch/escalations.jsonl` entry is generated. |

## Rationale
By moving from narrative to a constrained ontology, we convert subjective regret into actionable governance. 
*   **Why not H1/H2 for constitutional breaches?** Breaking invariants (like provenance) is fatal in a highly autonomous system; it requires immediate halting, whereas localized technical debt is an acceptable sprint compromise.
*   **Why a closed vocabulary?** Free-text categories (`[WeirdBug]`) prevent aggregation. A closed list allows `arch report` to group frictions and identify failing sub-systems algorithmically.
*   **Why strict escalation mapping?** Without automated consequences, Hansei remains theater. Tying H3 to `REVIEW Reject` enforces the "epistemological audit"—hiding a hack becomes an immediate system failure.

## Consequences

**Positive:**
- Hansei becomes machine-readable, feeding directly into the causal graph and `arch reflect`.
- Systemic friction automatically generates work (IDEAs), preventing silent codebase rot.
- Enforces honesty during `arch review`; the reviewer audits the alignment between code hacks and the declared Hansei.

**Negative / trade-offs:**
- Higher cognitive friction when closing tasks; agents/humans must carefully classify their compromises.
- Imposing a closed vocabulary means some edge-case issues might be awkwardly shoehorned into existing categories until a new ADR is proposed.
