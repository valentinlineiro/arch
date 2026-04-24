# DISPATCH.md
Generated: 2026-04-24T11:20:00Z
Sprint: 1 | Health: 🟢 GREEN

## Immediate actions (human required)
- [ ] Review and Approve refined TASK-012 (Deterministic REVIEWER engine) — Redefined to follow Clean Architecture and deterministic rules. — Urgency: today

## Agent invocations (ready to run)
1. `claude-code` EXEC TASK-012 (Implement deterministic REVIEWER engine) — context: agents/EXEC.md, docs/GUIDELINES.md, cli/src/main/ts/domain/ — reason: P1 READY, critical for guidelines enforcement.
2. `claude-code` EXEC TASK-025 (CLI — arch validate) — context: agents/EXEC.md, docs/TASK-FORMAT.md — reason: P0 READY, core validation logic.
3. `claude-code` EXEC TASK-026 (Implementación v0.2) — context: agents/EXEC.md, docs/TASK-FORMAT.md, docs/adr/ADR-003-dispatch-ephemeral.md — reason: P0 READY, critical path for v0.2.
4. `claude` EXEC TASK-011 (Maintain CHANGELOG) — context: agents/EXEC.md, docs/SPRINT.md, docs/agents/HUMAN.md, git log — reason: P2 READY.

## Maintenance actions
- None.

## Flags for next planning session
- TASK-027 (CLI Migration) is DONE.
- TASK-012 redefined as a CLI engine (not an AI agent).
- TASK-028 (Folder-based architecture) is in REFINEMENT.
