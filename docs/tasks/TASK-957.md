## TASK-957: Implement automatic sprint lifecycle in arch govern
**Meta:** P1 | L | READY | Focus:no | 2-code-generation | claude | arch.config.json, docs/RETRO.md, .arch/focus-ledger.jsonl
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

**BLOCKED on 2 structural failures. Everything else is derived.**

---

**Structural failure 1: No Sprint State Machine**

The system has events (SPRINT_OPEN/CLOSE), a counter config (sprintCloseAfterN), and ledger entries — but no formal model of what a sprint *is* as a system entity. Without a state machine (ACTIVE → CLOSED → NEXT_PENDING + valid transitions + invariants per state), the ledger is untrustworthy, the retro is not derivable, and govern cannot be idempotent.

Every other gap in this task is a symptom of this absence: govern responsibilities, ADR split, idempotency semantics, close trigger behavior — all of these resolve once there is a formal state model.

**Structural failure 2: No source of truth**

The system currently mixes four implicit oracles:
- `arch.config.json` — intent
- `.arch/focus-ledger.jsonl` — events
- `docs/tasks/` filesystem — real task state
- `docs/RETRO.md` — aggregate projection

There is no arbiter. This is multi-oracle architecture. Any bug is irreproducible under this model. Any replay can diverge. Any refactor silently breaks semantics.

---

**Minimal unblock set (in order):**

1. **SprintState model** — define ACTIVE / CLOSED / NEXT_PENDING, valid transitions, and which oracle is authoritative for each state field. Until this exists, no implementation decision is stable.

2. **Authority boundary** — define explicitly what `arch govern` reads, what it writes, and what it is prohibited from touching directly. This resolves the govern-as-god-loop risk and makes idempotency a provable property.

3. **RETRO contract** — not a format design problem, a projection problem: RETRO entry = deterministic function of (sprint_id, open_ts, close_ts, tasks, velocity_by_size). Append-only keyed by sprint_id. This is simple once the state model exists.

The "backlog → READY queue" terminology change and ledger schema versioning are real but non-blocking — they should be tracked separately and applied after the state model is stable.

**Next step: design artifact, not code.** See IDEA-sprint-state-machine (to be created).

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
