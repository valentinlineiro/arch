## TASK-971: Implement Materialized Reporting Layer (Periodic Status)
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/domain/services/status-report-service.ts

**Depends:** TASK-950

### Context

Status documents (`README.md`, `docs/ROADMAP.md`) are currently manual and drift from reality. Per user directive, these must be treated as a **materialized reporting layer**: strictly derivative, non-authoritative snapshots of system state.

**CRITICAL INVARIANT:** This layer must never be consumed as operational input by any other ARCH component. It is a "one-way mirror" for human consumption only. Automating this after TASK-950 ensures that we are reporting on a hardened epistemological contract rather than generating "apparent consistency" over ambiguous data.

### Acceptance Criteria

- [x] `StatusReportService` implemented as a **read-only projection engine**.
  - **Constraint:** Strictly non-authoritative. No inference, no narratives, no "intelligent" summaries.
  - `file: cli/src/main/ts/domain/services/status-report-service.ts`

- [ ] Output is structurally separated into a **Typed Schema**.
  - Generates `.arch/status-projection.json` as the primary artifact.
  - Markdown is merely a terminal renderer of this schema.
  - `file: cli/src/main/ts/domain/services/status-report-service.ts`

- [ ] Schema strictly adheres to **Allowed Primitives**:
  - Allowed: Raw task states (counts by enum), string IDs, ISO timestamps.
  - Prohibited: Ratios (e.g., progress %), rankings, interpreted deltas, health indices.
  - `prose: verified by architectural review of PrimitiveStatusReport interface`

- [x] `arch status --publish` command implemented.
  - Generates the schema, then renders and injects the Markdown.
  - `cmd: node cli/dist/index.js status --publish`

- [x] `arch govern` automatically triggers `--publish` after deterministic ticks.
  - `file: cli/src/main/ts/application/use-cases/govern-system.ts`

### Definition of Done
- [x] All ACs checked by Auditor → prose: Auditor verifies each AC against repo state
- [x] Tests pass → cmd: npm test --prefix cli; exit: 0
- [x] `arch review` passes → cmd: node cli/dist/index.js review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Redefined as a "Materialized Reporting Layer" to prevent documentary feedback loops and protect epistemic integrity.
**Constraint:** No constraints apply as the task has just been initialized.
**Cost:** No cost has been incurred yet for this task execution.
**Forward Action:** Implement StatusReportService as a read-only projection.