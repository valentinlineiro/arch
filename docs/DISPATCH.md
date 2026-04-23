# DISPATCH.md
Generated: 2026-04-23T10:30:00Z
Sprint: 1 | Health: 🟢 GREEN

## Immediate actions (human required)
_None_

## Agent invocations (ready to run)
<!-- Ordered by priority. Each line is a complete invocation instruction. -->
1. `codex` `EXEC` `TASK-010` — context: `docs/agents/EXEC.md` `docs/SPRINT.md` `scripts/arch-install.sh` `TASK-004` — reason: P0 core project interaction layer
2. `codex` `EXEC` `TASK-004` — context: `docs/agents/EXEC.md` `docs/SPRINT.md` `scripts/arch-install.sh` — reason: P1 remote installer bootstrap
3. `claude` `EXEC` `TASK-011` — context: `docs/agents/EXEC.md` `docs/SPRINT.md` `docs/agents/HUMAN.md` `git log` — reason: P2 CHANGELOG maintenance
4. `claude` `EXEC` `TASK-015` — context: `docs/agents/CONDUCTOR.md` `docs/SPRINT.md` — reason: P2 CONDUCTOR protocol refinement

## Maintenance actions
_None_

## Flags for next planning session
- **Status vocabulary** — ensure all agents are using the updated status fields consistently.
