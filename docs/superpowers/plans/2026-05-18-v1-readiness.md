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

These are the explicit gates already in the repo. Nothing else should block the 0.8.0 tag.

| Item | Status | Tracking |
|------|--------|----------|
| `arch init` full repo scaffolding with stack detection | IN_PROGRESS | TASK-919 |
| `npm publish --access public` from `cli/` without errors | READY (blocked on TASK-919) | TASK-920 |
| Version bump to `0.8.0` in `cli/package.json` and `arch.config.json` | Pending TASK-920 | TASK-920 |
| `npx arch init` verified in a clean directory | Pending TASK-920 | TASK-920 |

**0.8.0 is a publish gate, not a quality gate.** TASK-920 depends on TASK-919. Neither requires roadmap completeness.

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

**Verdict:** ApprovalPresent and TaskTemplateCompliance warnings are backlog debt that compounds as new tasks accumulate. Fix before 1.0.0, not after.

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
| CLI Unification | No (0.8.0 ships current surface) | Desirable for usability, but not a correctness gate. Defer to post-1.0.0 polish unless the command surface is actively misleading. |
| Refinement Funnel Tightening | Partial | TTL enforcement and admission bar. The IDEA backlog currently has 40+ drafts. Without TTL, the funnel is a tar pit. This is a 1.0.0 concern if IDEA accumulation is visibly corrupting planning signal. |

### 4. `arch capture` operational, not just implemented

Currently PARTIAL: the pipeline exists but is not validated as reducing friction vs manual task creation. Before 1.0.0, one of the following must be true:

- `arch capture` is validated as Operational (measurably faster, correct AC templates, accurate context inference), **or**
- `arch capture` is explicitly marked as `PARTIAL` in user-facing docs with a clear "use `arch task create` instead" path.

A 1.0.0 system should not advertise a feature it can't recommend.

### 5. npm publish and install path actually work

TASK-920 is the gate, but the test is: does `npx arch init` in a clean directory produce a working ARCH repo without requiring documentation lookup? If the answer is no, 0.8.0 ships a broken first impression and 1.0.0 inherits it.

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
  ├── Clear ApprovalPresent + TaskTemplateCompliance drift (governance backlog)
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

## Open Questions (for human decision before ROADMAP update)

1. **INBOX invariant:** Keep write-only (move sprint checkpoint signal to `.arch/escalations.jsonl`) or downgrade invariant to "agents must not *act* on INBOX state as a control signal"? This determines whether loop-engine.ts is a bug or a valid exception.

2. **Lock model:** Persist `Locked-commit` and round-trip it through the parser, or remove the write and keep locks in-memory only? Either is valid; the contradiction is the problem.

3. **Tiered Obligations:** What is the actual threshold? XS gets no Hansei? XS+S get no Approval? The L3 gate (XS+S self-archive) implies the answer, but it is not stated as a universal obligation rule.

4. **Refinement Funnel TTL:** Is the 40+ IDEA backlog a signal that the funnel needs enforcement now, or is that acceptable during pre-1.0.0 exploration? If TTL goes in before 1.0.0, several pending IDEAs will expire — is that the intent?

5. **`arch capture` verdict:** Operational or documented-as-partial? This requires a session where `arch capture` is tested against a real task and the friction delta is measured.

---

## What Does NOT Block 1.0.0 (per reviewer assessment)

- Multiagent runtime
- AI-proposed policies
- Causal graph compounding (real data too sparse to evaluate yet)
- Domain packs
- Phase D (reflexive closure)
- `arch ask` improvement beyond current operational state

These are 2.0 work. Including them in a 1.0.0 checklist inflates scope and delays shipping without improving integrity.
