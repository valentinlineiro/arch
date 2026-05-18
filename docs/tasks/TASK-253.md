## TASK-253: Wire causal graph ingestion into task completion flow
**Meta:** P1 | M | READY | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/causal-arbitrator.ts, cli/src/main/ts/domain/repositories/, .arch/causal-graph.jsonl, .arch/causal-signal.jsonl

### Context

The causal graph currently requires explicit operator action to accumulate edges (e.g., manual `arch causal add` commands). This means graph density depends on discipline, not on the default workflow. A graph that requires effort to feed will remain sparse.

The strategic mandate (IDENTITY.md §4): the causal graph must operate as an invisible default. It must be fed automatically at task completion without operator intent.

At task completion, the system has enough structured data to emit low-cost signals automatically:
- `TASK-XXX implements ADR-YYY` — derivable from the task's Context field referencing an ADR file
- `TASK-XXX caused_by TASK-YYY` — derivable from the Depends field
- `TASK-XXX category:<HanseiCategory>` — derivable from the Hansei block (already logged to `hansei-category-log.jsonl`)

These are not facts — they are signals at bootstrap confidence. The existing causal-arbitrator.ts Bootstrap Mode (corpus < 100 edges, single-domain corroboration sufficient) handles promotion logic.

### Acceptance Criteria

- [ ] `mark-task-done.ts` auto-emits an `implements` signal to `causal-signal.jsonl` only for explicit ADR references (`**ADR:** ADR-XXX` or exact `ADR-XXX` tokens), not for directory-level context paths such as `docs/adr/`.  →  grep: "implements\|ADR-\d\+\|causal.*signal" cli/src/main/ts/application/use-cases/mark-task-done.ts
- [ ] `mark-task-done.ts` auto-emits a `caused_by` signal for each TASK-ID in the task's Depends field at closure.  →  prose: verified by reading mark-task-done.ts Depends extraction logic
- [ ] `mark-task-done.ts` auto-emits a `category` signal when a Hansei block with a valid Category is present at closure.  →  prose: verified by reading mark-task-done.ts Hansei signal emission
- [ ] Auto-emitted signals preserve schema compatibility by keeping `source: "system"` and using `confidence: 0.5`; automatic provenance is conveyed by the `task_completed:TASK-XXX` event.  →  grep: "source\\|confidence\\|task_completed" .arch/causal-signal.jsonl
- [ ] `causal-arbitrator.ts` requires no source-specific branching for these signals; arbitration continues to distinguish them only by confidence and corroboration.  →  prose: verified by reading arbitrator source handling
- [ ] No auto-emission occurs for tasks with empty Context and no Depends field (no-op, not an error).  →  prose: verified by reading guard clause in mark-task-done.ts
- [ ] Signal emission happens only after the task has been successfully persisted as `DONE`; signal-write failure does not roll back task closure.  →  prose: verified by reading mark-task-done.ts save/emission order
- [ ] CLI tests cover: auto-emission with ADR context, auto-emission with Depends, no-op with empty fields.  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] Closing a task with a populated Context field (referencing an ADR) and a Depends field produces new entries in `.arch/causal-signal.jsonl` without any operator action.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Decisions

- **ADR heuristic:** emit `implements` only from explicit ADR identifiers, never from broad context-path entries. Directory-level context is routing metadata, not causal evidence.
- **Schema compatibility:** do not introduce a new `source: "auto"` variant in this task. Existing signal schema stays intact with `source: "system"`; automatic origin is conveyed by event type and lower confidence.
- **Emission ordering:** persist task closure first, then emit signals. Signal append failures are non-fatal and must not revert the task's `DONE` state.

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Schema compatibility resolved by reusing `source: "system"` rather than introducing a new `source: "auto"` variant. Automatic provenance is conveyed via `confidence: 0.5` and the `task_completed` event rather than a new source discriminator.

**Constraint:**
Introducing a new source variant would require updating all causal signal readers and the arbitrator schema validation within this task's scope, increasing the implementation surface beyond what an M task should carry.

**Cost:**
Readers must check confidence rather than source to distinguish auto-emitted from human-asserted signals. The distinction is less explicit in the schema but acceptable at current corpus density.
