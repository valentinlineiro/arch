# Weak Signals — Layer 0 tension accumulation
<!-- Not canonical. Not enforced. Not linked to invariants. -->
<!-- These are human intuition fragments: "something feels structurally wrong but I can't formalize it yet." -->
<!-- No legitimacy gate. No validation required. Purely accumulative. -->
<!--  -->
<!-- Format per entry: -->
<!-- ## [date] [rough area] [loose impact class — unclassified is valid and preferred over forced precision] -->
<!-- **Adjudicate by:** [date or "after N THINK reviews"] -->
<!-- [1-3 sentences of raw observation. No structure required.] -->
<!-- [Optional: what would need to be true for this to become a validated TENSION?] -->
<!--  -->
<!-- Decay rule (protocol, not automation): -->
<!-- Every weak signal has an adjudication deadline. When THINK reviews this file and a signal is past -->
<!-- its deadline, THINK emits [TENSION-DECAY] to stdout — it does NOT make the decision. -->
<!-- REFLECT surfaces pressure. REFLECT never closes anything. -->
<!-- The decision belongs to the human (or eventually GOVERN when rule-based lifecycle enforcement exists). -->
<!--  -->
<!-- Three outcomes available to the human after a TENSION-DECAY signal: -->
<!--   PROMOTE  — signal passes legitimacy gate → human writes validated TENSION record, links it here -->
<!--   DEMOTE   — insufficient evidence → human appends "Demoted [date]: [reason]", moves to Demoted section -->
<!--   EXTEND   — new evidence justifies more time → human updates deadline and documents why -->
<!-- "EXTEND" may be used at most once per signal. After that: PROMOTE or DEMOTE. No permanent suspension. -->
<!--  -->
<!-- Divergence tracking (required on every adjudication): -->
<!-- When recording a decision, always include: -->
<!--   REFLECT suggested: PROMOTE | DEMOTE | EXTEND (from the [TENSION-DECAY] emission) -->
<!--   Human decided:     PROMOTE | DEMOTE | EXTEND -->
<!--   Diverged:          yes | no -->
<!-- If diverged: one sentence on why. This is not justification — it is measurement. -->
<!--  -->
<!-- Why this matters: if REFLECT suggestions and human decisions converge consistently, -->
<!-- governance authority is drifting toward the LLM without anyone deciding it should. -->
<!-- That is soft delegation — invisible, gradual, and more dangerous than explicit authority grant. -->
<!-- Low divergence rate over time is a warning signal, not a success metric. -->
<!--  -->
<!-- Note: classification here is a provisional gesture, not an assertion. If a signal's class -->
<!-- shifts between sessions, record both — the instability itself is data about the signal's nature. -->
<!--  -->
<!-- Periodic review: if a signal recurs across 2+ sessions or its area matches a later validated TENSION, -->
<!-- consider whether it should be promoted. Promotion requires passing the legitimacy gate. -->
<!-- If a signal becomes a validated TENSION, mark it: [→ TENSION-NNN]. -->
<!--  -->
<!-- Purpose: capture what the system doesn't yet have vocabulary for. -->
<!-- A clean weak-signals log means the system is losing early signals, not that the ontology is stable. -->

---

## 2026-05-12 — governance naming surface [unclassified]
**Adjudicate by:** 2026-06-26 (after 6 THINK reviews, extended once 2026-05-15)

`arch govern`, `arch conduct`, and THINK all touch the governance domain but represent different layers (enforcement, trigger, analysis). The current command surface does not make these distinctions visible. A contributor navigating the CLI sees three things that feel related without knowing which ones are deterministic. Whether this is cosmetic or structural depends on a question I cannot answer from current data: is the IDENTITY.md §7 invariant sufficient to block misuse at the command surface, or does proximity in the CLI cause contributors to wire enforcement dependencies before reading the invariant? Classification is genuinely unresolved. Forcing it now would be false precision. The govern/THINK split is frozen in TENSION-001; this signal asks whether the rest of the command surface carries the same risk at a lower intensity. Revisit when there is evidence of actual contributor navigation paths.

[→ TENSION-001 (partially addresses — enforcement/analysis split frozen, but full command surface disambiguation is not yet done)]

**Adjudication 2026-05-15:** REFLECT suggested: EXTEND. Human decided: EXTEND. Diverged: no.
Extension reason: no concrete contributor navigation incident has been documented; the question cannot be answered from current data alone.

## 2026-05-12 — additive legitimacy bias in DriftChecker [structural-governance]
**Adjudicate by:** after 3 THINK reviews — PROMOTED 2026-05-15 [→ TENSION-002]

EscalationMaturity treats any modification to a "protected path" (domain models, repositories) as suspicious and demands an ADR. This made sense when the primary risk was unreviewed additions. But it encodes a hidden asymmetry: addition is presumed neutral, deletion is presumed suspicious, and the checker has no vocabulary for *ontological excision* — intentional removal of an artifact that has outlived its design rationale. The symptom appeared when removing INTENT: the checker flagged the deletion as a governance violation even though the explicit decision record (REJECT in the IDEA file, cleaned references, no orphan dependencies) was structurally complete. The bias matters because ARCH depends on the ability to kill dead ontology. If the audit layer structurally discourages subtraction, it will produce a selection pressure toward accumulation — and accumulation eventually looks like health until it doesn't. What would need to be true to PROMOTE: a second instance where legitimate excision triggers a false governance signal, or evidence that contributors hold back intentional removals to avoid audit friction. The fix, if promoted, is not "ignore deletions" — it is a legitimacy check with different semantics: was there an explicit REJECT/supersession? were references cleaned? do orphan operational dependencies remain? That is a richer question than "was a protected path touched?"

**Adjudication 2026-05-15:** REFLECT suggested: PROMOTE (id: THINK-cd04e55a). Human decided: PROMOTE. Diverged: no. IDEA-excision-legitimacy-check exists and is structurally admissible.

## 2026-05-12 — constraint axis drift without retroactive re-projection [epistemic-governance]
**Adjudicate by:** 2026-06-26 (after 6 THINK reviews, extended once 2026-05-15)

The constraint evaluation framework for IDEA adjudication evolved mid-session from an informal 3-cluster taxonomy (prerequisite chain / wrong layer / premature generalization) to a 5-axis orthogonal space (dependency ordering / temporal validity / abstraction layer / observability validity / priority displacement). The 18 decisions made during this session are documented under inconsistent vocabulary: 13 under the 3-cluster framing, 5 under the 5-axis framing. The archive does not flag this discontinuity — old entries look structurally complete but are incomparable with new entries under a shared rubric. The hidden risk is not that past decisions were wrong, but that future THINK sessions will treat the archive as a uniform corpus and derive patterns from incomparable records. A related design implication: when a new axis is introduced, the system currently has no mechanism to re-project prior decisions under the new constraint space. "Structurally admissible" in session N means something different than "structurally admissible" in session N+3 if two new axes have been added in between. What would need to be true to PROMOTE: evidence that a future THINK session draws a pattern inference from the archive that is invalidated by the vocabulary discontinuity, or a second axis introduction that makes the re-projection cost concrete enough to design against.

**Adjudication 2026-05-15:** REFLECT suggested: EXTEND. Human decided: EXTEND. Diverged: no.
Extension reason: no concrete misdirection case from archive incomparability has emerged yet.

## 2026-05-12 — capability-triggered state transition missing from IDEA lifecycle [structural-lifecycle]
**Adjudicate by:** after 3 THINK reviews — PROMOTED 2026-05-15 [→ TENSION-003]

ARCH currently has three state machines that are not synchronized: IDEA lifecycle state (DRAFT / PROMOTED / REJECTED), dependency evaluation (static text parsing by THINK), and system capability state (implicit — not modeled anywhere). When a system capability changes — e.g., `arch ask` v1 becomes operational — there is no mechanism by which capability-gated IDEAs re-enter evaluation. The dependency is recorded as prose ("blocked until arch ask v1"). THINK reads it as a fixed string and correctly defers again. TTL eventually fires and archives the IDEA as stale. Both outcomes are wrong: the IDEA was valid, it was structurally complete, but it was capability-bound. The current lifecycle has no third state between READY and STALE that means "semantically valid, evaluation is impossible until a runtime capability exists." The practical consequence is silent false negatives: valid deferred work that was correctly logged gets silently misclassified and lost — not through bad decisions, but through state machine disjointness. This is worse than duplication (which is visible) because the loss is invisible. No implementation expected from this signal. No dependency on arch ask v1 work to resolve the signal itself. The purpose of this entry is to prevent re-derivation and to prevent THINK from misclassifying capability-gated IDEAs as stale artifacts. What would need to be true to PROMOTE: a concrete case where a previously-valid capability-gated IDEA is archived by TTL, or a second artifact requiring the same latent-valid state.

**Adjudication 2026-05-15:** REFLECT suggested: PROMOTE (id: THINK-662afdc8). Human decided: PROMOTE. Diverged: no. IDEA-context-control TTL-archiving this session is a concrete instance of the failure mode.

## 2026-05-12 — Chronicle write/synthesize symmetry [epistemic]
**Adjudicate by:** after 2 THINK reviews — PROMOTED 2026-05-15 [→ TENSION-004]

`arch causal add` and `arch causal synthesize` both write to the graph layer, but they represent fundamentally different epistemic operations: `add` asserts a human-authored belief, `synthesize` derives a belief from existing edges using a rule. If a contributor treats them as equivalent writes to a causal database, the signal → arbitration → truth pipeline collapses — direct mutation bypasses arbitration and contaminates committed truth with unverified inference. The command names look symmetric; the operations are not. Impact class is probably epistemic: the error corrupts what the system believes, not just what it executes. Promote to validated TENSION when there is a concrete scenario where a normal contributor makes this mistake in real use.

**Adjudication 2026-05-15:** REFLECT suggested: PROMOTE — FINAL (id: THINK-4d4c215d). Human decided: PROMOTE. Diverged: no. The risk is asymmetric and the command naming issue is concrete and actionable.

---

## Demoted signals
<!-- Signals that did not pass the legitimacy gate after their adjudication deadline. -->
<!-- Format: [original date] [area] — Demoted [date]: [reason] -->
<!-- Purpose: retain the signal as evidence that the category was considered and rejected. -->
<!-- A full demoted section is a healthy sign — it means the system is exercising pressure, not accumulating indefinitely. -->
