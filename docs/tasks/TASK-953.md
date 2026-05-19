## TASK-953: Unify governance terminology: Tier 1/2 → Class I/II
**Meta:** P3 | XS | READY | Focus:no | 6-writing | local | docs/adr/ADR-013-two-tier-drift-detection.md, docs/GOVERNANCE.md

**Depends:** none

### Context

`ADR-013-two-tier-drift-detection.md` uses "Tier 1/Tier 2" terminology.
`docs/GOVERNANCE.md` uses "Class I/Class II" for the same structural distinction (deterministic vs non-mechanizable).

**Scope distinction (verification gate):** ADR-013's Tier 1/2 is scoped to drift detection only. GOVERNANCE.md Class I/II is a broader governance epistemology covering all evaluable decisions. The labels describe overlapping concepts, not an identical layer — Tier 2 (THINK Phase 2.5 producing IDEAs) is one instantiation of Class II, not its definition. Renaming must not imply ADR-013 defines the full Class I/II taxonomy.

**Resolution:** Rename Tier 1/2 to Class I/II in ADR-013 and add a cross-reference to `docs/GOVERNANCE.md` making the scope explicit. This unifies terminology without flattening the distinction.

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
