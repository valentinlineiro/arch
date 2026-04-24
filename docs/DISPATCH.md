# DISPATCH.md
Generated: 2026-04-24T10:15:00Z
Sprint: 1 | Health: 🟢 GREEN

## Immediate actions (human required)
- [ ] Promote TASK-022 to BACKLOG — Refinement finished, READY_FOR_PROMOTION. — Urgency: this sprint

## Agent invocations (ready to run)
1. `claude-code` EXEC TASK-025 (CLI — arch validate) — context: agents/EXEC.md, docs/TASK-FORMAT.md — reason: P0 READY, dependency TASK-024 met.
2. `codex` EXEC TASK-010 (Build `arch` CLI) — context: agents/EXEC.md, docs/SPRINT.md, scripts/arch-install.sh, TASK-004 — reason: P0 READY, dependencies met.
3. `claude` EXEC TASK-011 (Maintain CHANGELOG) — context: agents/EXEC.md, docs/SPRINT.md, docs/agents/HUMAN.md, git log — reason: P2 READY, no dependencies.

## Maintenance actions
- None.

## Flags for next planning session
- TASK-024 completed: v0.2 task format canonical spec is now the source of truth in `docs/TASK-FORMAT.md`.
- Path to v0.2 implementation: TASK-025 (READY) → TASK-026 (READY).
