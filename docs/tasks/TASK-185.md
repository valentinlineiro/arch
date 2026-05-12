## TASK-185: Consolidate CLI - merge read-only subcommands into `task`
**Meta:** P2 | M | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/task-command.ts, scripts/arch.sh
**Depends:** none

### Context
Part 1 of 2 for IDEA-consolidate-cli-commands. Merges loose read-only subcommands into `task`, removes `status` (subset of `inbox`), and cleans up the `archive` shell alias. TASK-175 (arch.sh cleanup) is a prerequisite and is in REVIEW.


### Relevant Context
_confidence: 0.49_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/application/use-cases/select-next-task.ts _(domain)_
- cli/src/main/ts/application/use-cases/generate-inbox.ts _(domain)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

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

### Acceptance Criteria
- [ ] `arch task next` replaces `arch next` (delegates to existing SelectNextTask logic)
- [ ] `arch task rank` replaces `arch rank` (delegates to existing RankCommand logic)
- [ ] `arch task promote <IDEA-slug>` replaces `arch promote` (delegates to existing PromoteCommand logic)
- [ ] `arch next`, `arch rank`, `arch promote` removed from index.ts and arch.sh (backward-compat aliases emit a deprecation warning for one version)
- [ ] `arch status` removed — `arch inbox` is the canonical dashboard
- [ ] `archive` shell alias in arch.sh removed (`arch task done` is canonical)
- [ ] `arch task --help` output lists all subcommands including next/rank/promote

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
- [ ] CHANGELOG entry for removed commands
