# ADR-019: Constitutional Hansei Ontology

**Date:** 2026-05-14
**Status:** PROPOSED
**Deciders:** Human Architect, Gemini CLI

---

## Context
The current Hansei (retrospective) implementation in ARCH is narrative prose appended at the end of a task. It relies on the implementing agent's virtue to admit mistakes rather than structural enforcement. This leads to post-hoc rationalization, "roleplay" retrospectives ("I could have been clearer"), and hides technical debt. Hansei is currently a "metrical footnote" rather than a "constitutional gate," making it impossible to systematically route architectural pain into governance or the causal graph. We need to formalize Hansei's ontology—severity levels, controlled vocabulary, and escalation policies—before implementing validation rules.

## Decision
We redefine Hansei as a mandatory, structured diagnostic tool evaluated during the `arch review` phase. It is governed by a strict ontology with automated escalation paths. A task cannot move to `DONE` without a structurally valid and **epistemologically reconciled** Hansei.

Hansei must follow this exact schema:
```markdown
## Hansei
**Severity:** [H0|H1|H2|H3a|H3b]
**Category:** [Controlled Vocabulary]
**Decision:** [The specific technical or process compromise made.]
**Constraint:** [The pressure or missing info that forced the compromise.]
**Cost:** [The specific debt or risk introduced.]
**Forward Action:** [Link to an IDEA, escalation, or specific cleanup task, if applicable.]
```

### 1. Severity Levels (Constitutional Impact)
Severity measures architectural impact, not emotional gravity.

*   **H0 — Observation:** No actual debt. A note on optimization or preference.
*   **H1 — Localized Debt:** Contained compromise. Does not alter architecture or induce repetition.
*   **H2 — Systemic Friction:** A repeating problem revealing poor system ergonomics. **Requires Evidence:** ≥3 repeated occurrences across tasks or explicit cross-module friction. Must generate an obligatory `IDEA`.
*   **H3a — Blocking Invalidity:** Violates core ARCH operating principles (integrity, provenance). Immediate rejection.
*   **H3b — Escalated Risk:** Significant constitutional risk that requires explicit Architect (human) override. **Requires Expiry:** Must specify a cleanup task (TASK-XXX) and an expiration trigger.

### 2. Controlled Vocabulary (Categories)
Categories are strictly limited to the following closed list.

*   **Technical:** `[TypeHack]`, `[LeakyAbstraction]`, `[DeferredTest]`, `[ContextWaste]`, `[SymbolDiscovery]`, `[HiddenDependency]`, `[SpecDrift]`
*   **Process:** `[ProcessViolation]`, `[PrematureOptimization]`, `[ReviewBlindspot]`, `[MissingDecisionRecord]`
*   **Constitutional:** `[ProvenanceBreak]`, `[IntegrityCorruption]`, `[FailOpenBehavior]`, `[AuditGap]`

### 3. Epistemological Reconciliation (The Audit Gate)
To prevent "strategic under-declaration," `arch review` distinguishes between **Declared Hansei** (agent statement) and **Observed Hansei** (Reviewer audit).

*   **Audit Principle:** Hiding debt is a higher violation than the debt itself.
*   **Meta-Violation [AuditGap]:** If the Reviewer detects hidden debt, understated severity, or omitted constitutional compromise, the task is automatically reclassified as **Severity: H3a** with category `[AuditGap]`.
*   **Reconciliation Flow:** `Declared Hansei` -> `Reviewer Audit` -> `Observed Hansei`. If `Observed > Declared`, the task is rejected for epistemological corruption.

### 4. Automated Escalation Policy
Severity directly maps to automated system consequences enforced by `arch review`.

| Severity | Mandatory Consequence |
| :--- | :--- |
| **H0** | None. Tracked for metadata. |
| **H1** | Tracked in task history. |
| **H2** | **IDEA Required.** Evidence-backed link in "Forward Action". |
| **H3a** | **Blocking Reject.** `arch review` fails immediately. |
| **H3b** | **Human Override + Expiry.** Merge blocked until human adds a `DECISION` record to `.arch/escalations.jsonl` with Owner and Expiry TASK. |

### 5. Anti-Goodhart Principle: Fidelity Over Safety
Hansei must optimize for fidelity, not defensive signaling. Both under-declaration (concealment) and defensive over-declaration (inflation) are governance failures.

*   **Under-declaration (Concealment):** Hidden debt or minimized severity to bypass review. -> **[AuditGap], H3a**.
*   **Over-declaration (Inflation):** Inflated severity or unnecessary escalation used as a "safety ritual" to appear honest or avoid scrutiny. -> **[ProcessViolation]**. Reviewer may downgrade severity and reject unnecessary IDEA creation.
*   **The Auditor's Mandate:** The goal is accurate constitutional mapping. The Reviewer has the authority to adjust both Declared and Observed Hansei to match reality.

## Rationale
By moving from narrative to a constrained ontology, we convert subjective regret into actionable governance.
*   **Declared vs. Observed:** Prevents the system from being "gamed" by ensuring that the statement of truth is audited against implementation reality.
*   **AuditGap as H3a:** Establishes that concealment is fatal to system integrity.
*   **H3a/H3b Split:** Provides a release valve (human override) for complex architectural trade-offs that are risky but necessary, preventing the system from becoming completely stagnant while maintaining high-friction visibility.
*   **H2 Thresholds:** Prevents the backlog from becoming a "zombie yard" of single-occurrence issues mislabeled as systemic.
*   **Override Expiry:** Prevents H3b overrides from becoming permanent exceptions or "nuclear waste tombs" in the codebase.
*   **Anti-Inflation:** Ensures Hansei remains a high-signal diagnostic tool rather than a bureaucratic game.

## Consequences

**Positive:**
- Hansei becomes machine-readable, feeding directly into the causal graph and `arch reflect`.
- Systemic friction automatically generates work (IDEAs), preventing silent codebase rot.
- Enforces honesty during `arch review`; the reviewer audits the alignment between code hacks and the declared Hansei.

**Negative / trade-offs:**
- Higher cognitive friction when closing tasks; agents/humans must carefully classify their compromises.
- Imposing a closed vocabulary means some edge-case issues might be awkwardly shoehorned into existing categories until a new ADR is proposed.
