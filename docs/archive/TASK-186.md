## TASK-186: Consolidate CLI - absorb validate and lint into review
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/review-command.ts, scripts/arch.sh
**Closed-at:** 2026-05-12T08:54:22.277Z
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
- [x] `arch validate` removed — `arch review` covers config + meta format validation
- [x] `arch lint` removed — `arch review` covers task format validation
- [x] `arch review --fast` added as an alias that skips drift checks (for contexts where only format validation is needed, replacing validate/lint use cases)
- [x] `arch validate` and `arch lint` emit a deprecation warning for one version before removal
- [x] arch.sh and index.ts updated; removed commands no longer appear in usage output

### Definition of Done
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`
- [x] CHANGELOG entry for removed commands

## Hansei
Minimal change: `--fast` is a single flag that skips passing driftChecker to ReviewSystem, which already supports optional driftChecker. The pre-commit hook fires `arch lint` (now deprecated) during commits — it still works since the deprecated alias is kept for one version, so no disruption. The deprecated aliases emit warnings to stderr so they don't pollute stdout-parsed output.
