## TASK-955: Implement arch task reprioritize - corpus-informed priority diff
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | cli/src/main/ts/
**Depends:** none

### Context

Task priority degrades as the corpus grows — it is set at creation time and never updated against accumulated causal evidence. `arch task reprioritize` is a deterministic, human-confirmed command that reads the corpus and emits a priority diff. It does not write without confirmation.

Full design: `docs/refinement/IDEA-corpus-informed-reprioritization.md`

### Gaps

Three implementation gaps before work can start:

1. **ECP registry schema** — `.arch/ecp-registry.jsonl` record format must be specified (fields: ecp_id, canonical_signature, state, confidence, recurrence_count, class_field, task_ids, created_at, updated_at).
2. **Ranking output format** — the diff output (task ID, current priority, proposed priority, signal evidence) must be defined before the command can be coded against it.
3. **N for garbage collection** — the number of govern cycles before an ECP transitions to DISCARDED. Operationally determined; propose 10 as default, overridable in `arch.config.json`.

### Acceptance Criteria

- [ ] `arch task reprioritize` reads READY queue and emits a priority diff — each entry shows: task ID, current priority, proposed priority, and the signals that drove it (recurrence count, fan-out count, causal ancestry, age).  →  cmd: arch task reprioritize; exit: 0
- [ ] ECP registry written to `.arch/ecp-registry.jsonl` after each run — UNCLASSIFIED clusters that cross `CAUSAL_RECURRENCE_THRESHOLD` create ECP_CREATED entries.  →  file: .arch/ecp-registry.jsonl
- [ ] No priority change is applied without explicit human confirmation (`Apply? y/N`). Dry-run by default.  →  grep: Apply? cli/src/main/ts/application/commands/reprioritize-command.ts
- [ ] Demotion bound enforced: no task drops more than one priority level per pass (except when recurrence ≥ 2× threshold AND I6 conditions met).  →  grep: DEMOTION_BOUND cli/src/main/ts/application/use-cases/reprioritize-corpus.ts
- [ ] Fan-out scoring uses direct dependents only (1 hop). No transitive traversal.  →  grep: direct.*fan.out cli/src/main/ts/application/use-cases/reprioritize-corpus.ts
- [ ] Human recency guard: tasks with priority set or confirmed within 30 days are not demoted by corpus signal alone.  →  grep: RECENCY_GUARD cli/src/main/ts/application/use-cases/reprioritize-corpus.ts
- [ ] `npm test` passes.  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] `arch task reprioritize` functional against the live ARCH corpus.
- [ ] ECP registry populated after first run.
- [ ] All invariants from IDEA spec (I1–I7 + IMeta + ECP) verifiable against implementation.
- [ ] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Task created at promotion time. No implementation decisions made yet. Hansei to be rewritten at REVIEW with real findings.
**Constraint:** Hansei seeded at creation to satisfy M+ linter requirement. All fields are placeholders.
**Cost:** None at this stage.
**Forward Action:** Rewrite at REVIEW per ADR-019.
