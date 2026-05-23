## TASK-186: Consolidate CLI - absorb validate and lint into review
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/review-command.ts, scripts/arch.sh
**Closed-at:** 2026-05-12T08:54:22.277Z
**Depends:** none

## Hansei
Minimal change: `--fast` is a single flag that skips passing driftChecker to ReviewSystem, which already supports optional driftChecker. The pre-commit hook fires `arch lint` (now deprecated) during commits — it still works since the deprecated alias is kept for one version, so no disruption. The deprecated aliases emit warnings to stderr so they don't pollute stdout-parsed output.
