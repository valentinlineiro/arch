# TENSION-NNN: [short title]
**Detected:** [ISO date]
**Detected by:** human | think | review
**Status:** open | frozen | watching  *(transitions are human-initiated — REFLECT never changes status)*
**Impact class:** [see below — free text, uncertainty is valid]
**Causal edge:** [Chronicle edge ID if recorded]

<!-- Impact class is an interpretive judgment, not a property of the phenomenon.
     A signal can shift class depending on context of use. Do not force premature resolution.
     
     Classes (not an enum — combinations and uncertainty are first-class):
       cosmetic   — naming confusion or surface symmetry; does not change execution, authority, or causality.
       structural — changes decision flow, command authority, or architectural layering.
       epistemic  — affects truth formation, graph integrity, or invariant derivation.
       causal     — affects system behavior directly; wrong classification produces wrong outcomes in
                    enforcement or policy gates. Consequence is irreversible without explicit correction.
       unclassified — uncertainty is real. Do not force classification to avoid the blank field.
     
     Valid notations:
       structural               — single class, analyst is confident
       structural | epistemic   — genuinely uncertain between two; note the condition that determines which
       structural → epistemic   — starts as structural; escalates to epistemic if a specific condition is met (name it)
       unclassified             — no stable classification yet; acceptable, especially in weak signals
     
     Calibration questions (use when uncertain):
       cosmetic vs structural: "does a contributor following the wrong model take a different action?"
       structural vs epistemic: "does the error corrupt stored beliefs, or only execution path?"
       epistemic vs causal: "is the consequence reversible by re-running a command?" If no: causal.
     
     Warning: over-categorization is a failure mode. A well-labeled uncertainty is more reliable
     than a false precision. If classification changes across sessions, that instability is signal.
-->

---

## Legitimacy gate

Before writing this record, confirm all four conditions. If any fails, this is not a TENSION — it is a concern, a heuristic, or a refactor candidate. Do not create the record.

- [ ] **Concrete actor**: there is a plausible future contributor who will reach this boundary in normal work — not an adversary, not a hypothetical. Name the scenario.
- [ ] **Named invariant**: the misuse produces a violation of a specific, documented invariant — not aesthetic discomfort or vague "feels wrong."
- [ ] **Probable, not merely imaginable**: the current design contains a structural element (a name, a trigger, a shared boundary) that makes the misuse argument feel reasonable. Specify it.
- [ ] **Asymmetric damage**: if the misuse argument succeeds, the consequence is worse than confusion — policy corruption, moat erosion, governance failure, loss of auditability. The damage is prospective, not necessarily current. Name the consequence class and whether it is reversible.

If all four pass, write the record. Otherwise stop.

---

## Boundary
[What two concepts are inadequately separated or incorrectly named]

## Current ambiguity
[The specific structural element — code, command name, shared trigger, or shared artifact — that creates the confusion]

## Likely misuse
[The specific rationalization a future actor will use:
"Because X already does Y, it should also be allowed to Z."
Be concrete. Name the X, Y, and Z.]

## Violation risk
[Which named invariant would be breached if the argument succeeds, and what class of damage results]

## Preventive invariant
[The constraint that, if frozen, makes the misuse argument structurally invalid]

## Required correction
[What must change: naming, command split, constitutional update, ADR, or a combination. If the correction requires implementation, link to the IDEA.]

## Resolution
[Filled when Status moves to frozen or watching — what was done and where it lives]
