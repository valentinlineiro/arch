## TASK-225: Causal signal arbitration layer [ADR-015]
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/, .arch/
**Depends:** TASK-224

## Context

ADR-014 (causal graph) and the causal-conditioned retrieval in AskCorpus close the forward loop: graph → query scoring. This task closes the backward loop: lifecycle events → signal layer → arbitration → graph mutation.

The design is settled in ADR-015. Key properties:
- Query Isolation Invariant: queries read only committed graph, never signals
- Arbitration Determinism Invariant: same signal set always produces same mutations
- Signal lifecycle: pending → applied | conflicted | stale (after EXPIRY_CYCLES reviews)

## Acceptance Criteria

- [ ] `causal-signal.ts` domain model exists with `CausalSignal`, `CausalSignalUpdate`, signal domain/type/status types
- [ ] `causal-signal-log.ts` — append-only JSONL storage for signals and update records
- [ ] `causal-arbitrator.ts` — deterministic arbitration engine implementing both invariants
- [ ] `arch causal arbitrate` subcommand works end-to-end
- [ ] Query Isolation Invariant enforced: no signal-layer path into `causalRelevance()` or any query scoring
- [ ] Arbitration Determinism Invariant enforced: sort by timestamp/domain/id before evaluation
- [ ] `npm test` passes (all existing tests + new arbitrator tests)
- [ ] ADR-015 exists and is referenced here

## Hansei
