## TASK-953: Unify governance terminology: Tier 1/2 to Class I/II
**Meta:** P1 | XS | DONE | Focus:no | 6-writing | local | docs/adr/ADR-013-two-tier-drift-detection.md, docs/GOVERNANCE.md
**Turns:** 0
**Closed-at:** 2026-05-19T12:55:32.582Z
**Actor:** unknown
**Locked-commit:** 87dd2b9a
**Created-at:** 2026-05-19T12:54:58.245Z

**Depends:** none

### Context

`ADR-013-two-tier-drift-detection.md` uses "Tier 1/Tier 2" terminology.
`docs/GOVERNANCE.md` uses "Class I/Class II" for the same structural distinction (deterministic vs non-mechanizable).

**Scope distinction (verification gate):** ADR-013's Tier 1/2 is scoped to drift detection only. GOVERNANCE.md Class I/II is a broader governance epistemology covering all evaluable decisions. The labels describe overlapping concepts, not an identical layer — Tier 2 (THINK Phase 2.5 producing IDEAs) is one instantiation of Class II, not its definition. Renaming must not imply ADR-013 defines the full Class I/II taxonomy.

**Resolution:** Rename Tier 1/2 to Class I/II in ADR-013 and add a cross-reference to `docs/GOVERNANCE.md` making the scope explicit. This unifies terminology without flattening the distinction.


### Relevant Context
_confidence: 0.40_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- .arch/focus-ledger.jsonl _(utility)_
- docs/INBOX.md _(utility)_
- docs/tasks/TASK-953.md _(utility)_
- cli/src/main/ts/domain/services/deterministic-ac-verifier.ts _(core)_

**ADRs:**
- ADR-013: Two-Tier Drift Detection Architecture _(enforced)_
- ADR-023: Deterministic Gate Invariant _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [ ] ADR-013 uses "Class I" where it previously said "Tier 1".  →  grep: "Class I" docs/adr/ADR-013-two-tier-drift-detection.md
- [ ] ADR-013 uses "Class II" where it previously said "Tier 2".  →  grep: "Class II" docs/adr/ADR-013-two-tier-drift-detection.md
- [ ] ADR-013 no longer contains bare "Tier 1" or "Tier 2" labels.  →  prose: verified by reading ADR-013 — "Tier 1" and "Tier 2" as standalone labels are absent; "two-tier" in the title and filename is exempt
- [ ] ADR-013 cross-references GOVERNANCE.md to scope the distinction.  →  grep: "GOVERNANCE" docs/adr/ADR-013-two-tier-drift-detection.md
- [ ] The conceptual distinction between drift detection (ADR-013 scope) and the full Class I/II epistemology (GOVERNANCE.md scope) is preserved — ADR-013 does not claim to define Class I/II in general.  →  prose: verified by reading the updated ADR-013 framing
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] All ACs checked.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
