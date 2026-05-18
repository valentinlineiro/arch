# ARCH v1.0.0 Readiness Checklist

> **Anchored to:** repo state as of 2026-05-18 (v0.6.0)
> **Purpose:** Strategic decomposition — not a roadmap truth update. ROADMAP.md is updated only after this checklist is agreed.
> **Context:** External review concluded ARCH is a serious 0.6.x system with real core architecture, but not one release away from 1.0.0. The path is 0.8.0 → clear governance drift → complete simplification and governance roadmap items → 1.0.0.

---

## Evaluation Invariant (from ROADMAP.md)

| State | Meaning |
|-------|---------|
| **Implemented** | Code exists and pipeline runs |
| **Operational** | User learns less than they save. Net friction positive. |
| **Compounding** | Accumulated advantage that cannot be reconstructed outside the system |

Items in this checklist are evaluated against *Operational*, not *Implemented*.

---

## Must Before 0.8.0

These are the only two gates. `0.8.0` is a publish milestone, not a quality milestone.

| Item | Status | Tracking |
|------|--------|----------|
| `arch init` full repo scaffolding with stack detection | IN_PROGRESS | TASK-919 |
| `npm publish --access public` from `cli/` without errors | READY (blocked on TASK-919) | TASK-920 |

**0.8.0 is a publish gate, not a quality gate.** TASK-920 depends on TASK-919. Nothing else should block the `0.8.0` tag.

**What 0.8.0 is NOT:** It is not a signal that the system is production-grade. It is the first public artifact so external users can install and evaluate.

---

## Must Before 1.0.0

These are items whose absence would make a 1.0.0 claim misleading. Grouped by concern.

### 1. Governance drift cleared from committed state

This concern has improved materially. `arch review` now passes clean, but the underlying warning-class backlog still matters as a `1.0.0` readiness concern because several classes were only reduced, not structurally retired.

| Warning | Current violations | Tracking |
|---------|--------------------|----------|
| `ApprovalPresent` | Historically noisy; field-index false positives fixed in TASK-928. Residual archived-task policy/backfill debt must still be clarified before `1.0.0`. | TASK-928 closed; no dedicated follow-up yet |
| `FocusStatusAlignment` | TASK-249 / TASK-919 corpus drift repaired in TASK-933. | Closed in TASK-933 |
| `TaskTemplateCompliance` | Reduced by TASK-933 (18 → 15 items). Remaining Hansei/AC backlog still exists and needs structural resolution, not endless stubbing. | IDEA-tiered-obligations + residual task backlog |
| `Census` | `docs/tasks/` still exceeds budget. `arch review` is clean, but the underlying compression problem remains a scale/readability concern. | No task |

**Verdict:** `FocusStatusAlignment` is no longer a blocker. The remaining `1.0.0` concern is structural cleanup of `ApprovalPresent`, `TaskTemplateCompliance`, and `Census` so the clean review state is durable rather than incidental.

### 2. Protocol contradictions resolved (TASK-927 follow-up)

The three High-severity contradictions identified in TASK-927 are now resolved:

| Finding | IDEA | Blocker for 1.0.0? |
|---------|------|---------------------|
| INBOX invariant: code reads what the spec says is write-only | IDEA-inbox-invariant-contradiction | Resolved in **TASK-930** — machine reads removed; structured state used instead. |
| Lock model: DO.md says write to meta; AGENTS.md says in-memory only; persisted field is never read back | IDEA-lock-model-contradiction | Resolved in **TASK-931** — `Locked-commit` persists as auxiliary provenance and now round-trips. |
| Archive status: drift-checker does not validate that archived tasks have DONE status | IDEA-archive-status-drift-check | Resolved in **TASK-932** — archive status now validated explicitly. |

**Verdict:** This bucket is no longer a `1.0.0` blocker.

**Residual note:** The bundled git sync contradiction from TASK-927 finding 6 remains undecided and should be tracked separately, but it is no longer tied to the resolved High-finding loop.

### 3. Phase 1 simplification — minimum viable subset

Phase 1 is marked NOT STARTED across four items. Not all are 1.0.0 requirements, but two are:

| Item | 1.0.0? | Rationale |
|------|--------|-----------|
| **Metrics Narrowing** | **Yes** | The current report emits CONFIDENCE: 0% warnings when integrity is low. A 1.0.0 system should not publish metrics it doesn't trust. Suppress LOW-confidence signals or gate the report. |
| **Tiered Obligations** | **Yes** | XS tasks currently rely on cleanup/backfill discipline to stay compliant. TASK-933 reduced the symptoms; Tiered Obligations is the structural fix that prevents the same compliance debt from re-accumulating. |
| CLI Unification | No | Desirable for usability, but not a correctness gate. Defer past `1.0.0` unless command-surface confusion becomes an integrity issue. |
| Refinement Funnel Tightening | No | Important planning hygiene, but not a `1.0.0` correctness gate in the current assessment. |

### 4. `arch capture` operational, not just implemented

Currently PARTIAL: the pipeline exists but is not validated as reducing friction vs manual task creation. Before 1.0.0, one of the following must be true:

- `arch capture` is validated as Operational (measurably faster, correct AC templates, accurate context inference), **or**
- `arch capture` is explicitly marked as `PARTIAL` in user-facing docs with a clear "use `arch task create` instead" path.

A 1.0.0 system should not advertise a feature it can't recommend.

### 5. `npx arch init` actually works in a clean directory

This is related to TASK-920 but should still be treated as a `1.0.0` concern independently of the `0.8.0` publish tag. The question is: does `npx arch init` in a clean directory produce a working ARCH repo without requiring documentation lookup? If the answer is no, `0.8.0` may still publish, but `1.0.0` should not ship.

---

## Defer to 2.0

These are real roadmap items but none of them are correctness or integrity gates. Shipping 1.0.0 without them is defensible.

| Item | Phase | Why Defer |
|------|-------|-----------|
| CLI Unification (intent-based verbs) | Phase 1 | UX improvement, not correctness. Current surface works. |
| Structural Policies (declarative arch boundaries) | Phase 4 | Requires Phase A stable + real TENSION corpus. Gate is legitimately upstream. |
| AI-Proposed Policies | Phase 4 | Requires governance enforcement separation at command surface AND policy corpus. Not close. |
| Operational Load / Adaptive Planning | Phase 5 | Valuable; not central to epistemic integrity claim. |
| Domain Packs (non-software) | Phase 6 | The software pack is implicit. Generalization is post-1.0. |
| Multiagent Runtime (Planner/Historian/Conductor) | Phase 7 | ~15% complete per ROADMAP estimate. A spec without a runtime is not a runtime. |
| Cross-Task Pattern Distillation | Phase 8 | Requires corpus. Manual corpus first, then automation. |
| Phase D — Reflexive Closure | Phase D | Gated on Phase C operational. Phase C hasn't started. |
| `arch ask` compounding validation | Phase 2 | Corpus is too young. Claim "compounding" only when data supports it. |
| Human Decision Drift Monitoring | Phase D | Requires REFLECT influence corpus. |

---

## Implied Sequencing

```
0.6.0 (now)
  │
  ├── TASK-919 (arch init) → TASK-920 (npm publish)
  │
0.8.0 (publish gate)
  │
  ├── Confirm public install path works (`TASK-919` → `TASK-920`)
  ├── Metrics Narrowing (suppress LOW-confidence output)
  ├── Tiered Obligations (proportional protocol weight)
  ├── Clear durable governance backlog (`ApprovalPresent`, `TaskTemplateCompliance`, `Census`)
  └── Validate arch capture as Operational OR document it as PARTIAL
  │
1.0.0 (integrity gate)
  │
  └── Everything else → 2.0
```

---

## Decisions (2026-05-18)

All five open questions answered. ROADMAP.md update is now unblocked.

1. **INBOX invariant — DECIDED:** Keep `docs/INBOX.md` write-only for automation. Machine control signals move to `.arch/` structured state. The code reads in `loop-engine.ts` and `next-command.ts` are bugs to remove. `DO.md` instruction to read INBOX is wrong. → **TASK-930 (DONE)**. Git sync contradiction in this IDEA is a separate, still-undecided item.

2. **Lock model — DECIDED:** Persist `Locked-commit` as auxiliary provenance field; must round-trip through the parser. `lockedBy`/`lockedAt` remain in-memory only. Meta line stays canonical and compact. → **TASK-931 (DONE)**

3. **Tiered Obligations — DECIDED:**
   - XS: no Hansei unless triggered (blocker, size miss, constitutional anomaly)
   - S: same triggered basis, lightweight only
   - M/L: mandatory structured Hansei
   - Approval: follows L3 gate logic (XS+S self-archive eligible ≡ Approval exempt), not a blanket rule
   → **IDEA-tiered-obligations** (spec written; promote when ready to implement)

4. **ROADMAP threshold — DECIDED:** Update `ROADMAP.md` only after the five `Must Before 1.0.0` buckets have explicit decisions. May name unresolved gates as blockers. Do not convert undecided questions into roadmap truth.

5. **`arch capture` verdict — DECIDED:** Treat as `PARTIAL` until validated operationally in a real clean-flow session. Do not promote by assumption. `ROADMAP.md` entry updated accordingly.

6. **Archive status validation — DECIDED BY IMPLEMENTATION:** `ArchiveMetaIntegrity` must validate terminal archive status by scanning meta fields, matching `ArchiveParser` semantics. → **TASK-932 (DONE)**

---

## What Does NOT Block 1.0.0 (per reviewer assessment)

- Multiagent runtime
- AI-proposed policies
- Causal graph compounding (real data too sparse to evaluate yet)
- Domain packs
- Phase D (reflexive closure)
- `arch ask` improvement beyond current operational state

These are 2.0 work. Including them in a 1.0.0 checklist inflates scope and delays shipping without improving integrity.
