## TASK-175: Migrate arch.sh routing logic to TypeScript
**Meta:** P2 | M | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | scripts/arch.sh, cli/src/main/ts/application/commands/exec-command.ts, cli/src/main/ts/index.ts
**Depends:** none

### Context
`arch.sh` owns two pieces of logic that belong in TypeScript: (1) a 90-line inline `node -e "..."` agent-routing script (`invoke_agent`) that duplicates `ConfigLoader` and is untyped/untested; (2) a post-`task done` govern side effect that caused the double-govern bug fixed in TASK-174 and still fires for standalone `task done` calls. Both should move to the TypeScript CLI, reducing `arch.sh` to a pure thin dispatcher.

### Acceptance Criteria
- [ ] `invoke_agent` routing logic moved into a new `ExecCommand` TypeScript class using `ConfigLoader`
- [ ] `local` routing mode preserved (prints prompt file, no AI invocation)
- [ ] CLI fallback order (preferred first, then others) and `which` availability checks covered by unit tests
- [ ] Post-`task done` govern side effect removed from `arch.sh`
- [ ] `arch.sh` reduced to a thin dispatcher: subcommand → `node dist/index.js "$@"`, plus `--push` flag handling for `review`
- [ ] CHANGELOG entry noting removal of post-`task done` govern

### Definition of Done
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`
