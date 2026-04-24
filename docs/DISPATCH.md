# DISPATCH.md
Generated: 2026-04-24T11:45:00Z
Sprint: 1 | Health: 🟢 GREEN

## Immediate actions (human required)
- [ ] Review and Approve TASK-012 re-re-refinement (Deterministic REVIEWER engine) — Now aligned with Clean Architecture and TS structure. — Urgency: today

## Agent invocations (ready to run)
1. `claude-code` EXEC TASK-012 (Implement deterministic REVIEWER engine in CLI) — context: agents/EXEC.md, cli/src/main/ts/domain/, docs/GUIDELINES.md — reason: P1 READY, priority for guideline enforcement.
2. `claude-code` EXEC TASK-025 (CLI — arch validate) — context: agents/EXEC.md, docs/TASK-FORMAT.md — reason: P0 READY.
3. `claude-code` EXEC TASK-026 (Implementación v0.2) — context: agents/EXEC.md, docs/TASK-FORMAT.md, docs/adr/ADR-003-dispatch-ephemeral.md — reason: P0 READY.
4. `claude` EXEC TASK-011 (Maintain CHANGELOG) — context: agents/EXEC.md, docs/SPRINT.md, cli/src/main/ts/, git log — reason: P2 READY.

## Maintenance actions
- None.

## Flags for next planning session
- TASK-027 (CLI Migration) is DONE and restructured into `cli/`.
- TASK-012 redefined as a deterministic engine, moving away from AI-based review.
