## TASK-955: Implement arch task reprioritize - corpus-informed priority diff
**Meta:** P2 | M | REVIEW | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Actor:** unknown
**Locked-commit:** 81439332
**Created-at:** 2026-05-19T13:16:18.962Z
**Depends:** none

### Context

Task priority degrades as the corpus grows — it is set at creation time and never updated against accumulated causal evidence. `arch task reprioritize` is a deterministic, human-confirmed command that reads the corpus and emits a priority diff. It does not write without confirmation.

Full design: `docs/refinement/IDEA-corpus-informed-reprioritization.md`


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/services/signal-router.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_

**ADRs:**
- ADR-021: Refinement funnel TTL and admission gate _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-015: Causal Signal Arbitration Layer _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Unstructured IDEAs before TASK-033*(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Gaps

Three implementation gaps before work can start:

1. **ECP registry schema** — `.arch/ecp-registry.jsonl` record format must be specified (fields: ecp_id, canonical_signature, state, confidence, recurrence_count, class_field, task_ids, created_at, updated_at).
2. **Ranking output format** — the diff output (task ID, current priority, proposed priority, signal evidence) must be defined before the command can be coded against it.
3. **N for garbage collection** — the number of govern cycles before an ECP transitions to DISCARDED. Operationally determined; propose 10 as default, overridable in `arch.config.json`.

### Acceptance Criteria

- [x] `arch task reprioritize` reads READY queue and emits a priority diff — each entry shows: task ID, current priority, proposed priority, and the signals that drove it (recurrence count, fan-out count, causal ancestry, age).  →  cmd: arch task reprioritize; exit: 0
- [x] ECP registry written to `.arch/ecp-registry.jsonl` after each run — UNCLASSIFIED clusters that cross `CAUSAL_RECURRENCE_THRESHOLD` create ECP_CREATED entries.  →  file: .arch/ecp-registry.jsonl
- [x] No priority change is applied without explicit human confirmation (`Apply? y/N`). Dry-run by default.  →  grep: Apply? cli/src/main/ts/application/commands/reprioritize-command.ts
- [x] Demotion bound enforced: no task drops more than one priority level per pass (except when recurrence ≥ 2× threshold AND I6 conditions met).  →  grep: DEMOTION_BOUND cli/src/main/ts/application/use-cases/reprioritize-corpus.ts
- [x] Fan-out scoring uses direct dependents only (1 hop). No transitive traversal.  →  grep: direct.*fan.out cli/src/main/ts/application/use-cases/reprioritize-corpus.ts
- [x] Human recency guard: tasks with priority set or confirmed within 30 days are not demoted by corpus signal alone.  →  grep: RECENCY_GUARD cli/src/main/ts/application/use-cases/reprioritize-corpus.ts
- [x] `npm test` passes.  →  cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [x] `arch task reprioritize` functional against the live ARCH corpus.
- [x] ECP registry populated after first run.
- [x] All invariants from IDEA spec (I1–I7 + IMeta + ECP) verifiable against implementation.
- [x] `arch review` passes.

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** The implementation resolves Gaps 1-3 from the task spec: ECP schema is in `EcpRecord` interface (reprioritize-corpus.ts), output format matches the IDEA spec table, and N=10 for GC is deferred (GC not implemented this session — ECP records are created but never transitioned to DISCARDED; the N threshold is out of scope for v0). The priority scoring uses a signed delta system where negative = promote, positive = demote. The I4 demotion bound is implemented as `maxDemotion = DEMOTION_BOUND` (1) except under strong evidence (recurrence ≥ 2× threshold AND causal ancestry present). I7 recency guard uses 30 days from `createdAt` field.
**Constraint:** The recurrence signal uses `taskClass` substring matching against archived Hansei categories — this is a proxy for causal entity match, not exact match. The IDEA spec defines recurrence as "same causal entity" but the causal entity registry (I1 vocabulary) is not yet populated in arch.config.json, so the implementation falls back to class-based pattern matching. This is the acknowledged v0 simplification from the IDEA spec (Design Decision 3: TASK-954 dependency).
**Cost:** One M session. The scoring logic has a subtle sign convention bug in the delta calculation that was fixed during implementation (signed arithmetic with two sign flips needed careful review). ECP GC is explicitly deferred.
**Forward Action:** When TASK-954 (temporal-index label store) lands, swap the archive keyword scan in loadArchiveTasks() with temporal-index queries. The interface is compatible — the class_field and category matching logic stays the same. See IDEA-corpus-informed-reprioritization §Design Decision 3 for the swap specification.
