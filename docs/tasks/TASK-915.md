## TASK-915: arch explain TASK-XXX : causal chain reconstruction
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/commands/, cli/src/main/ts/application/use-cases/causal-signal-log.ts

**Depends:** none

### Context

ARCH has all the data to reconstruct task provenance : origin IDEA, refinement sessions, Hansei signals emitted, forward actions triggered. No command surfaces this chain. Before starting a related task, this must be manually reconstructed from grep.

### Acceptance Criteria

- [ ] `arch explain TASK-XXX` command registered in `index.ts`. Reads from:
  1. `docs/refinement/archive/` : finds IDEA whose Decision contains `TASK-XXX`
  2. `docs/archive/TASK-XXX.md` : reads Hansei (severity, category, decision, forward action)
  3. `.arch/causal-signal.jsonl` : finds signals with `candidate_from: TASK-XXX`
  4. `docs/tasks/*.md` and `docs/archive/*.md` : finds tasks referencing TASK-XXX in `Spawned-from` or `Depends:`
  - `file: cli/src/main/ts/application/commands/explain-command.ts`

- [ ] Output format (terminal only, no file writes):
  ```
  TASK-XXX : <title>
  Origin:     IDEA-slug (if promoted from refinement)
  Decision:   <Decision field from IDEA>
  Hansei:     H1 [SpecDrift] : <Decision excerpt, 60 chars>
  Signals:    2 causal signals emitted (epistemological, ontological)
  Downstream: TASK-YYY (spawned), TASK-ZZZ (depends)
  Pattern:    [SpecDrift] also in TASK-AAA, TASK-BBB (3 total)
  ```
  Gracefully omits sections when data is absent (no IDEA origin, no signals, etc.)
  - `cmd: node cli/dist/index.js explain TASK-901`

- [ ] `arch explain TASK-XXX` on a non-existent or READY task: exits 1 with `Task TASK-XXX not found in archive or tasks/`.
  - `cmd: node cli/dist/index.js explain TASK-999`

- [ ] Unit test: explain with full provenance chain renders all sections. Explain with no IDEA origin omits Origin section gracefully.
  - `prose: verified during implementation`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
