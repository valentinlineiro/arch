## TASK-185: Consolidate CLI - merge read-only subcommands into `task`
**Meta:** P2 | M | REVIEW | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/task-command.ts, scripts/arch.sh
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
- [x] `arch task next` replaces `arch next` (delegates to existing SelectNextTask logic)
- [x] `arch task rank` replaces `arch rank` (delegates to existing RankCommand logic)
- [x] `arch task promote <IDEA-slug>` replaces `arch promote` (delegates to existing PromoteCommand logic)
- [x] `arch next`, `arch rank`, `arch promote` removed from index.ts and arch.sh (backward-compat aliases emit a deprecation warning for one version)
- [x] `arch status` removed — `arch inbox` is the canonical dashboard
- [x] `archive` shell alias in arch.sh removed (`arch task done` is canonical)
- [x] `arch task --help` output lists all subcommands including next/rank/promote

### Definition of Done
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`
- [x] CHANGELOG entry for removed commands

## Hansei
Straightforward delegation — NextCommand, RankCommand, PromoteCommand already existed, so subcommands are thin wrappers. The tricky part was CLI_COMMANDS in drift-checker: deprecated aliases needed to be removed from the set since they no longer appear in README, otherwise Commands check WARNed. Also had to separate the compressed-archive commit (207 files) from the implementation commit to keep the diff atomic for review.
