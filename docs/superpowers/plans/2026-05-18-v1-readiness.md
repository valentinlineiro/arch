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

`arch review` currently shows four persistent warning classes. These are not noise — they are live violations that a 1.0.0 system should not carry.

| Warning | Current violations | Tracking |
|---------|--------------------|----------|
| `ApprovalPresent` | TASK-251, 254, 255, 256, 257, 917, 918, 921, 922 — missing `## Approval` sections | No task |
| `FocusStatusAlignment` | TASK-249 (READY+Focus:yes), TASK-919 (IN_PROGRESS+Focus:no) | IDEA-corpus-drift-repair (TASK-927) |
| `TaskTemplateCompliance` | 18 tasks missing Hansei or AC sections | No task |
| `Census` | `docs/tasks/` at 1,242 lines (budget: 1,000) | Implies archive backlog |

**Verdict:** All four warning classes need to be cleared before `1.0.0`. A system claiming `1.0.0` should not ship with persistent known governance drift in committed state.

### 2. Protocol contradictions resolved (TASK-927 open findings)

Three High-severity contradictions identified in TASK-927 remain unresolved:

| Finding | IDEA | Blocker for 1.0.0? |
|---------|------|---------------------|
| INBOX invariant: code reads what the spec says is write-only | IDEA-inbox-invariant-contradiction | **Yes** — the invariant is in AGENTS.md, the violation is in loop-engine.ts. A 1.0.0 system should not contradict its own core invariants in shipped code. |
| Lock model: DO.md says write to meta; AGENTS.md says in-memory only; persisted field is never read back | IDEA-lock-model-contradiction | **Yes** — the persisted boundary is dead weight. The decision (persist or don't) needs to be made and reflected in both docs and code before 1.0.0. |
| Archive status: drift-checker does not validate that archived tasks have DONE status | IDEA-archive-status-drift-check | **Yes** — archive integrity is a core claim of the system. The gap is small (one check to add). |

**Verdict:** All three need resolution before 1.0.0. The two decision-required ones (INBOX, lock model) need human calls first.

### 3. Phase 1 simplification — minimum viable subset

Phase 1 is marked NOT STARTED across four items. Not all are 1.0.0 requirements, but two are:

| Item | 1.0.0? | Rationale |
|------|--------|-----------|
| **Metrics Narrowing** | **Yes** | The current report emits CONFIDENCE: 0% warnings when integrity is low. A 1.0.0 system should not publish metrics it doesn't trust. Suppress LOW-confidence signals or gate the report. |
| **Tiered Obligations** | **Yes** | XS tasks carry the same Hansei/Approval overhead as L tasks. This is the primary source of TaskTemplateCompliance drift. Proportional protocol weight is required before 1.0.0 or the compliance gap will grow indefinitely. |
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
  ├── Clear ApprovalPresent + TaskTemplateCompliance + FocusStatusAlignment + Census drift
  ├── Resolve TASK-927 High findings (INBOX, lock model, archive status)
  ├── Metrics Narrowing (suppress LOW-confidence output)
  ├── Tiered Obligations (proportional protocol weight)
  └── Validate arch capture as Operational OR document it as PARTIAL
  │
1.0.0 (integrity gate)
  │
  └── Everything else → 2.0
```

---

## Decisions (2026-05-18)

All five open questions answered. ROADMAP.md update is now unblocked.

1. **INBOX invariant — DECIDED:** Keep `docs/INBOX.md` write-only for automation. Machine control signals move to `.arch/` structured state. The code reads in `loop-engine.ts` and `next-command.ts` are bugs to remove. `DO.md` instruction to read INBOX is wrong. → **TASK-930** (git sync contradiction in this IDEA is a separate, still-undecided item).

2. **Lock model — DECIDED:** Persist `Locked-commit` as auxiliary provenance field; must round-trip through the parser. `lockedBy`/`lockedAt` remain in-memory only. Meta line stays canonical and compact. → **TASK-931**

3. **Tiered Obligations — DECIDED:**
   - XS: no Hansei unless triggered (blocker, size miss, constitutional anomaly)
   - S: same triggered basis, lightweight only
   - M/L: mandatory structured Hansei
   - Approval: follows L3 gate logic (XS+S self-archive eligible ≡ Approval exempt), not a blanket rule
   → **IDEA-tiered-obligations** (spec written; promote when ready to implement)

4. **ROADMAP threshold — DECIDED:** Update `ROADMAP.md` only after the five `Must Before 1.0.0` buckets have explicit decisions. May name unresolved gates as blockers. Do not convert undecided questions into roadmap truth.

5. **`arch capture` verdict — DECIDED:** Treat as `PARTIAL` until validated operationally in a real clean-flow session. Do not promote by assumption. `ROADMAP.md` entry updated accordingly.

---

## What Does NOT Block 1.0.0 (per reviewer assessment)

- Multiagent runtime
- AI-proposed policies
- Causal graph compounding (real data too sparse to evaluate yet)
- Domain packs
- Phase D (reflexive closure)
- `arch ask` improvement beyond current operational state

These are 2.0 work. Including them in a 1.0.0 checklist inflates scope and delays shipping without improving integrity.
