## TASK-225: Causal signal arbitration layer [ADR-015]
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, .arch/
**Closed-at:** 2026-05-12T07:53:50.264Z
**Depends:** TASK-224

## Context

ADR-014 (causal graph) and the causal-conditioned retrieval in AskCorpus close the forward loop: graph → query scoring. This task closes the backward loop: lifecycle events → signal layer → arbitration → graph mutation.

The design is settled in ADR-015. Key properties:
- Query Isolation Invariant: queries read only committed graph, never signals
- Arbitration Determinism Invariant: same signal set always produces same mutations
- Signal lifecycle: pending → applied | conflicted | stale (after EXPIRY_CYCLES reviews)

## Acceptance Criteria

- [x] `causal-signal.ts` domain model exists with `CausalSignal`, `CausalSignalUpdate`, signal domain/type/status types
- [x] `causal-signal-log.ts` — append-only JSONL storage for signals and update records
- [x] `causal-arbitrator.ts` — deterministic arbitration engine implementing both invariants
- [x] `arch causal arbitrate` subcommand works end-to-end
- [x] Query Isolation Invariant enforced: no signal-layer path into `causalRelevance()` or any query scoring
- [x] Arbitration Determinism Invariant enforced: sort by timestamp/domain/id before evaluation
- [x] `npm test` passes (all existing tests + new arbitrator tests)
- [x] ADR-015 exists and is referenced here

## Hansei
Implemented and committed 2026-05-11; never formally closed. Signal layer has no real signals yet — the backward loop (lifecycle events → signal generation) was partially wired via TASK-226 for `arch loop` but `arch task done` and `arch govern` paths still don't generate signals automatically. That gap is the next Chronicle work item.
