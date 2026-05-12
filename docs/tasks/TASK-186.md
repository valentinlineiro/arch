## TASK-186: Consolidate CLI - absorb validate and lint into review
**Meta:** P2 | M | IN_PROGRESS | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/review-command.ts, scripts/arch.sh
**Depends:** none

### Context
Part 2 of 2 for IDEA-consolidate-cli-commands. `arch validate` and `arch lint` are strict subsets of `arch review`. Keeping them as separate commands adds surface area without adding capability.


### Relevant Context
_confidence: 0.46_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/application/use-cases/validate-task-acs.ts _(domain)_
- cli/src/main/ts/domain/services/config-loader.ts _(core)_

**ADRs:**
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-007: Census Context Budget Check in DriftChecker _(enforced)_

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
- [ ] `arch validate` removed — `arch review` covers config + meta format validation
- [ ] `arch lint` removed — `arch review` covers task format validation
- [ ] `arch review --fast` added as an alias that skips drift checks (for contexts where only format validation is needed, replacing validate/lint use cases)
- [ ] `arch validate` and `arch lint` emit a deprecation warning for one version before removal
- [ ] arch.sh and index.ts updated; removed commands no longer appear in usage output

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
- [ ] CHANGELOG entry for removed commands
