## IDEA: Migrate arch.sh routing logic to TypeScript

**Status:** PROMOTED → TASK-175
**Decision:** PROMOTE → TASK-175

### Problem
`arch.sh` currently owns two pieces of logic that belong in the TypeScript CLI:

1. **Inline agent-routing (`invoke_agent`):** A 90-line `node -e "..."` script embedded in bash that reads `arch.config.json`, selects a CLI, applies model tier overrides, and builds the exec command. It is untyped, untested, and duplicates config-reading logic already present in `ConfigLoader`.

2. **Post-`task done` govern side effect:** After `arch task done`, the shell re-invokes `arch govern`. This caused the double-govern-per-cycle bug fixed in TASK-174 for the loop, but the side effect remains for standalone `task done` calls — coupling two commands at the shell level rather than at the domain level.

### Proposed Direction
- Move `invoke_agent` routing into a new `ExecCommand` TypeScript class. It reads config via `ConfigLoader`, selects the CLI, and spawns the process — same behavior, but typed, covered by tests, and consistent with the rest of the codebase.
- Remove the post-`task done` govern call from `arch.sh`. Govern is the loop's responsibility; `task done` should only mark a task done.
- Reduce `arch.sh` to a pure thin dispatcher: parse the subcommand, invoke `node dist/index.js "$@"`, handle the `--push` flag for `review`. No embedded logic.

### Gaps
- `invoke_agent` handles a `local` routing mode (prints the prompt file instead of invoking an AI). This needs to be preserved in the TypeScript implementation.
- CLI fallback order (preferred CLI first, then others) and `which` availability checks need unit tests.
- Removing the post-`task done` govern may surprise users who rely on it outside the loop. Needs a note in CHANGELOG or a deprecation path.

### Estimate
M — TypeScript ExecCommand + tests + arch.sh simplification + CHANGELOG note.

## Decision
PROMOTE → TASK-175
