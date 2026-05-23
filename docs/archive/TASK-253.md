## TASK-253: Wire causal graph ingestion into task completion flow
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-done.ts, cli/src/main/ts/application/use-cases/causal-arbitrator.ts, cli/src/main/ts/domain/repositories/, .arch/causal-graph.jsonl, .arch/causal-signal.jsonl
**Closed-at:** 2026-05-19T09:02:39.823Z

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Schema compatibility resolved by reusing `source: "system"` rather than introducing a new `source: "auto"` variant. Automatic provenance is conveyed via `confidence: 0.5` and the `task_completed` event rather than a new source discriminator.

**Constraint:**
Introducing a new source variant would require updating all causal signal readers and the arbitrator schema validation within this task's scope, increasing the implementation surface beyond what an M task should carry.

**Cost:**
Readers must check confidence rather than source to distinguish auto-emitted from human-asserted signals. The distinction is less explicit in the schema but acceptable at current corpus density.

**Forward Action:**
No IDEA required — H0 observation with no systemic debt. Schema reuse is the intended long-term design.

## Approval
Approved-by: Auditor | 2026-05-19
