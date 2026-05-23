## TASK-955: Implement arch task reprioritize - corpus-informed priority diff
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Closed-at:** 2026-05-19T13:29:06Z
**Depends:** none

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** The implementation resolves Gaps 1-3 from the task spec: ECP schema is in `EcpRecord` interface (reprioritize-corpus.ts), output format matches the IDEA spec table, and N=10 for GC is deferred (GC not implemented this session — ECP records are created but never transitioned to DISCARDED; the N threshold is out of scope for v0). The priority scoring uses a signed delta system where negative = promote, positive = demote. The I4 demotion bound is implemented as `maxDemotion = DEMOTION_BOUND` (1) except under strong evidence (recurrence ≥ 2× threshold AND causal ancestry present). I7 recency guard uses 30 days from `createdAt` field.
**Constraint:** The recurrence signal uses `taskClass` substring matching against archived Hansei categories — this is a proxy for causal entity match, not exact match. The IDEA spec defines recurrence as "same causal entity" but the causal entity registry (I1 vocabulary) is not yet populated in arch.config.json, so the implementation falls back to class-based pattern matching. This is the acknowledged v0 simplification from the IDEA spec (Design Decision 3: TASK-954 dependency).
**Cost:** One M session. The scoring logic has a subtle sign convention bug in the delta calculation that was fixed during implementation (signed arithmetic with two sign flips needed careful review). ECP GC is explicitly deferred.
**Forward Action:** When TASK-954 (temporal-index label store) lands, swap the archive keyword scan in loadArchiveTasks() with temporal-index queries. The interface is compatible — the class_field and category matching logic stays the same. See IDEA-corpus-informed-reprioritization §Design Decision 3 for the swap specification.
