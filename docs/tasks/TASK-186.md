## TASK-186: Consolidate CLI - absorb validate and lint into review
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/review-command.ts, scripts/arch.sh
**Depends:** none

### Context
Part 2 of 2 for IDEA-consolidate-cli-commands. `arch validate` and `arch lint` are strict subsets of `arch review`. Keeping them as separate commands adds surface area without adding capability.

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
