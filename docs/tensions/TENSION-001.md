# TENSION-001: Governance enforcement vs governance analysis
**Detected:** 2026-05-12
**Detected by:** human
**Status:** frozen
**Impact class:** structural → epistemic *(interpretive judgment — not a property of the phenomenon)*
**Causal edge:** 313db304 (govern-think-coupling → caused_by → missing-enforcement-analysis-split)

<!-- Classification reasoning (revisable):
     structural — because a contributor following the wrong mental model takes a different action:
                  wires LLM output to an enforcement decision. This requires no malice, only a
                  reasonable misread of the command surface.
     → epistemic — if the structural violation succeeds once and is accepted as precedent, the
                   escalation path is: the system begins forming governance beliefs from model
                   confidence. That corrupts truth formation permanently. Irreversible without
                   explicit constitutional rollback.
     Condition for escalation: a PR is merged that accepts LLM output as satisfying a governance gate.
     Until that condition is met, this is structural. The → notation marks the threshold, not a fact. -->

## Legitimacy gate

- [x] **Concrete actor**: any contributor extending THINK's output surface (adding a new `arch govern` condition, wiring a new enforcement rule) will encounter the `runConduct()` trigger and see THINK running inside governance. The extension path is normal, not adversarial.
- [x] **Named invariant**: Deterministic Core Invariant (IDENTITY.md §7) — LLM output entering a governance enforcement decision.
- [x] **Probable**: `arch govern` and THINK share a command trigger chain. The naming is `arch govern → THINK`. No existing documentation separated enforcement from analysis when this was written. The misuse argument is structurally invited, not merely conceivable.
- [x] **Asymmetric damage**: once one LLM confidence score is accepted as a governance gate, the precedent is established. From there, "confidence is high enough" becomes a valid policy argument — policy enforcement loses reproducibility and auditability permanently.

---

## Boundary
Governance enforcement (deterministic, auditable rule execution) vs governance analysis (LLM-permitted proposals and summarization).

## Current ambiguity
`arch govern` triggers THINK via `runConduct()`. Both run under the same top-level governance command. Enforcement runs first — deterministically. Analysis runs after — via LLM. But the command surface presents them as a single identity: `arch govern → THINK`. Anyone reading the command sees governance and LLM in the same flow.

## Likely misuse
> "THINK already participates in govern, so it can also validate completion / block a transition / satisfy an escalation gate."

This argument is structurally plausible because the current naming creates semantic continuity between enforcement and analysis. The contributor does not intend to corrupt the invariant — they extend an existing pattern. That is how boundary decay works.

## Violation risk
Deterministic Core Invariant (IDENTITY.md §7): LLM output entering a governance enforcement decision. Once one LLM confidence score is accepted as a governance gate, the precedent is established. From there: "confidence is high enough" becomes a policy argument.

## Preventive invariant
> LLMs may emit governance signals, never governance truth. Governance enforcement is deterministic and must remain reproducible by re-running the same rule against the same state.

This invariant is now frozen in IDENTITY.md §7 with the misuse argument named explicitly.

## Required correction
1. Constitutional clarification — done (IDENTITY.md §7 updated 2026-05-12).
2. Command split — future target: `arch govern` (enforcement only) and `arch reflect` (analysis only), with govern optionally triggering reflect as a named side-effect. See IDEA-govern-reflect-split.md.

## Resolution
Invariant frozen. Misuse argument named and refused in the document. Future architectural split tracked as IDEA-govern-reflect-split.md. This tension is **frozen**, not closed — the command split is not yet implemented. Until it is, the frozen invariant is the only guard.
