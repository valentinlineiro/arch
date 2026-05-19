## TASK-952: Remove XL decomposition rule duplication
**Meta:** P1 | XS | DONE | Focus:no | 6-writing | local | docs/guidelines/core.md, AGENTS.md
**Turns:** 0
**Closed-at:** 2026-05-19T12:54:47.396Z
**Actor:** unknown
**Locked-commit:** a92f7398
**Created-at:** 2026-05-19T12:54:31.944Z

**Depends:** none

### Context

The rule that XL tasks must be decomposed before READY is stated in two places:

1. `docs/guidelines/core.md` §4 — "Decomposition: Tasks estimated XL must be decomposed before entering READY status." (canonical)
2. `AGENTS.md` "Hard limits" — "No `XL` tasks in READY — decompose first." (duplicate)

Remove the duplicate from `AGENTS.md`. The canonical statement stays in `core.md`.


### Relevant Context
_confidence: 0.43_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/services/reviewer.ts _(core)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/repositories/file-system.ts _(core)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-008: Centralize halt conditions in HALT.md _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_

**Guidelines:**
- core.md
- documentation.md

**Failure Patterns:**
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_
- Recursive review violation tasks*(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Acceptance Criteria

- [ ] Canonical rule is present in core.md.  →  grep: "decomposed before entering READY" docs/guidelines/core.md
- [ ] Duplicate removed from AGENTS.md.  →  prose: AGENTS.md Hard limits section no longer contains a standalone XL decomposition rule
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0

### Definition of Done

- [ ] All ACs checked.
- [ ] `arch review` passes.  →  cmd: arch review; exit: 0
