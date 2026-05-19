## TASK-957: Implement automatic sprint lifecycle in arch govern
**Meta:** P1 | L | BLOCKED | Focus:no | 2-code-generation | claude | arch.config.json, cli/src/main/ts/application/use-cases/govern.ts, docs/RETRO.md, .arch/focus-ledger.jsonl
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

**BLOCKING — design contracts missing before any code can be written:**

1. **SprintState model not defined.** "Current sprint = last SPRINT_OPEN event in ledger" is implicit. Needs an explicit model with documented invariants. Without this, govern's behavior is only legible by reading implementation.

2. **Archive count trigger is not idempotent as specified.** A counter-based approach drifts under retries and re-archives. Correct model: `count(tasks archived after sprint_open_timestamp) >= sprintCloseAfterN` — pure ledger query, no counter. This needs to be the stated design before implementation.

3. **RETRO.md format is undefined.** "Structured velocity record" is not a contract. Required: exact format (markdown table), dedup key (sprint-id), field list (sprint name, open/close timestamps, task count by size, delivered list, velocity = archived / ticks elapsed since open), append-only semantics.

4. **Focus-ledger schema has no versioning.** Adding SPRINT_OPEN/SPRINT_CLOSE event types without a registered event type list or schema version creates orphan events in future analysis. Schema extension strategy must be decided first.

5. **ADR-026 needs to be split into two.** Schema change (arch.config.json + ledger) and behavioral change (govern loop) have different enforcement mechanisms. One ADR conflates them.

6. **Backlog dissolution is a separate ontological change.** "backlog → READY queue" is not a text replace — it affects CLI help text, docs, tests, and external user expectations. It needs its own ADR and its own task. Mixing it here inflates scope and makes rollback harder.

7. **govern idempotency not decided.** Is `arch govern` idempotent on the sprint close path? If run twice on same state, does it open two sprints? This must be a stated invariant, not an emergent property.

**Until these are resolved, this task stays BLOCKED.**

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
