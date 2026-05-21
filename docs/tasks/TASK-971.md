## TASK-971: Implement Materialized Reporting Layer (Periodic Status)
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | local | cli/src/main/ts/domain/services/status-report-service.ts

**Depends:** TASK-950

### Context

Status documents (`README.md`, `docs/ROADMAP.md`) are currently manual and drift from reality. Per user directive, these must be treated as a **materialized reporting layer**: strictly derivative, non-authoritative snapshots of system state.

**CRITICAL INVARIANT:** This layer must never be consumed as operational input by any other ARCH component. It is a "one-way mirror" for human consumption only. Automating this after TASK-950 ensures that we are reporting on a hardened epistemological contract rather than generating "apparent consistency" over ambiguous data.

### Acceptance Criteria

- [ ] `StatusReportService` implemented as a **read-only projection engine**.
  - `file: cli/src/main/ts/domain/services/status-report-service.ts`

- [ ] Report generation logic uses only deterministic sources (Archive, Task Repository, ADRs).
  - Explicitly excludes `README.md` and `docs/ROADMAP.md` as inputs.
  - `prose: verified by architectural review of implementation`

- [ ] `injectIntoMarkdown(filePath, reportMarkdown)` uses non-normative tags.
  - Tags: `<!-- ARCH-REPORT:START -->` and `<!-- ARCH-REPORT:END -->`.
  - `prose: verified by unit test`

- [ ] `arch status --publish` command implemented.
  - Emits a warning: "⚠ Publishing materialized report. This artifact is non-authoritative."
  - `cmd: node cli/dist/index.js status --publish`

- [ ] `arch govern` triggers `--publish` ONLY after successful deterministic tick completion.
  - `file: cli/src/main/ts/application/use-cases/govern-system.ts`

- [ ] `README.md` and `docs/ROADMAP.md` seeded with initial report tags.
  - `file: README.md`
  - `file: docs/ROADMAP.md`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] Tests pass (unit + integration)
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Redefined as a "Materialized Reporting Layer" to prevent documentary feedback loops and protect epistemic integrity.
**Constraint:** No constraints apply as the task has just been initialized.
**Cost:** No cost has been incurred yet for this task execution.
**Forward Action:** Implement StatusReportService as a read-only projection.