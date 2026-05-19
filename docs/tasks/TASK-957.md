## TASK-957: Implement automatic sprint lifecycle in arch govern
**Meta:** P1 | L | READY | Focus:no | 2-code-generation | claude | arch.config.json, cli/src/main/ts/application/use-cases/govern.ts, docs/RETRO.md, .arch/focus-ledger.jsonl
**Depends:** none

### Acceptance Criteria
- [ ] `arch.config.json` has `sprintCloseAfterN` field (default 15).  →  file: arch.config.json
- [ ] `arch govern` closes the current sprint when N tasks have been archived since sprint open.  →  grep: "SPRINT_CLOSE" cli/src/main/ts/application/use-cases/govern.ts
- [ ] On sprint close, `arch govern` appends a structured velocity record to `docs/RETRO.md`.  →  grep: "RETRO" cli/src/main/ts/application/use-cases/govern.ts
- [ ] On sprint close, `arch govern` opens the next sprint with an auto-generated name derived from current version.  →  grep: "SPRINT_OPEN" cli/src/main/ts/application/use-cases/govern.ts
- [ ] `SPRINT_OPEN` and `SPRINT_CLOSE` events are appended to `.arch/focus-ledger.jsonl`.  →  grep: "SPRINT_OPEN\|SPRINT_CLOSE" cli/src/main/ts/application/use-cases/focus-ledger.ts
- [ ] "backlog" references in docs and guidelines replaced with "READY queue" or "backlog (READY tasks)".  →  prose: verified by grep scan of docs/
- [ ] ADR written before modifying `arch.config.json` schema.  →  file: docs/adr/ADR-026-automatic-sprint-lifecycle.md
- [ ] `npm test --prefix cli` passes.  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Context

Spec / IDEA: docs/refinement/IDEA-automatic-sprint-lifecycle.md

Sprint is a governance rhythm (retros, velocity, cadence-gated analysis), not just a label. Currently the full lifecycle — close, retro, open — requires manual edits to `arch.config.json` and `docs/RETRO.md`. This task automates it inside `arch govern`'s deterministic loop.

Key design decisions from the IDEA:
- Trigger is task count (sprintCloseAfterN), not calendar time
- Retro record is deterministic (derived from archive); THINK commentary remains advisory
- SPRINT_OPEN/SPRINT_CLOSE events extend the focus-ledger schema for queryability

### Gaps

- `arch.config.json` is a protected path — ADR-026 must be written before modifying the schema.
- `.arch/focus-ledger.jsonl` schema needs SPRINT_OPEN/SPRINT_CLOSE event types added — check existing schema definition in focus-ledger.ts.
- `docs/RETRO.md` format needs to be defined (structured record: sprint name, open date, close date, tasks delivered, velocity table by size).
- `arch govern` implementation location needs to be confirmed — check which use-case file contains the govern tick loop.
- "backlog" references in docs/ need auditing before replacement.

### Relevant Context
_confidence: 0.50_

**Files:**
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/repositories/task-repository.ts _(core)_
- cli/src/main/ts/domain/repositories/git-repository.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-015: Causal Signal Arbitration Layer _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-025: Two-Track Versioning Architecture _(enforced — sprint name derived from version)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor remain in `docs/tasks/` until the next `arch govern` tick. _(docs/KAIZEN-LOG.md)_
- Legacy tasks with stale dependencies*(Sprint 3)*: When an artifact is deleted, actively search for references in the backlog. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Implement automatic sprint lifecycle: arch govern closes sprint after N archived tasks, writes deterministic retro to docs/RETRO.md, opens next sprint with auto-generated name, appends SPRINT_OPEN/SPRINT_CLOSE events to focus-ledger.jsonl; dissolve backlog concept by replacing references with READY queue

### Definition of Done
- [ ] All ACs checked by Auditor  →  prose: Auditor verifies each AC against repo state
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Not yet started.
**Constraint:** No constraints apply — task has not started.
**Cost:** No cost incurred — task has not started.
**Forward Action:** None.
