## TASK-889: `arch task edit` — Interactive Metadata Management
**Meta:** P1 | S | IN_PROGRESS | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Created-at:** 2026-05-15T07:23:10.296Z
**Depends:** none

### Acceptance Criteria
- [ ] `arch task edit TASK-XXX` subcommand added to `TaskCommand`.
- [ ] CLI reads the current task and displays each editable meta field (priority, size, status, class, context) with its current value.
- [ ] User input is validated against `TaskValidator` before any file is written.
- [ ] On success, the task file is updated with a correctly formatted meta line and committed with `chore: [TASK-889] update metadata for TASK-XXX`.
- [ ] `arch review` passes after the edit.

### Context

### Relevant Context
_confidence: 0.44_

**Files:**
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- docs/TASK-FORMAT.md _(utility)_
- cli/src/main/ts/application/commands/task-command.ts _(domain)_

**ADRs:**
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_
- Stealth Merge Commits*(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch review` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol. _(docs/KAIZEN-LOG.md)_

### Context Feedback
_Was the Relevant Context above useful?_
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

_If partial or off:_
- [ ] wrong files
- [ ] missing files
- [ ] wrong ADRs
- [ ] too much noise
- [ ] confidence misleading

#### Problem
The `**Meta:**` line in ARCH tasks is a high-discipline regex-based string. Manually editing it (e.g., changing `P2` to `P1` or updating `Context`) is brittle and often causes `arch review` failures due to formatting errors.

#### Solution
Implement `arch task edit TASK-XXX` as an interactive CLI command.

**Workflow:**
1.  `arch task edit TASK-064`
2.  CLI displays current values and prompts for changes:
    - Priority (P0-P3)
    - Size (XS-XL)
    - Status (READY, BLOCKED, etc.)
    - Class (Select from registry)
    - Context (Comma-separated paths)
3.  CLI validates the new values against the `TaskValidator`.
4.  CLI updates the file directly and commits the change with a `chore: update metadata for TASK-XXX` message.

### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
