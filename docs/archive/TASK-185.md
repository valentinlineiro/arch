## TASK-185: Consolidate CLI - merge read-only subcommands into `task`
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/commands/task-command.ts, scripts/arch.sh
**Closed-at:** 2026-05-12T08:45:12.749Z
**Depends:** none

## Hansei
Straightforward delegation — NextCommand, RankCommand, PromoteCommand already existed, so subcommands are thin wrappers. The tricky part was CLI_COMMANDS in drift-checker: deprecated aliases needed to be removed from the set since they no longer appear in README, otherwise Commands check WARNed. Also had to separate the compressed-archive commit (207 files) from the implementation commit to keep the diff atomic for review.
