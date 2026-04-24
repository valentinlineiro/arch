# DISPATCH.md
Generated: 2026-04-24T12:00:00Z
Sprint: 1 | Health: 🟢 GREEN

## Immediate actions (human required)
- [ ] Review TASK-024 (Spec formato canónico v0.2) — Currently in REVIEW. Blocking TASK-025 and TASK-026 — Urgency: today
- [ ] Review and Adapt TASK-017/TASK-022 in REFINEMENT.md — ADR-003 makes DISPATCH.md ephemeral in v0.2; these tasks need v0.2 alignment — Urgency: this sprint

## Agent invocations (ready to run)
1. `codex` EXEC TASK-010 (Build `arch` CLI) — context: agents/EXEC.md, docs/SPRINT.md, scripts/arch-install.sh, TASK-004 — reason: P0 READY, dependencies met.
2. `claude` EXEC TASK-011 (Maintain CHANGELOG) — context: agents/EXEC.md, docs/SPRINT.md, docs/agents/HUMAN.md, git log — reason: P2 READY, no dependencies.

## Maintenance actions
- None.

## Flags for next planning session
- TASK-017 and TASK-022 moved to REFINEMENT.md to ensure consistency with v0.2 architecture.
- Path to v0.2: TASK-024 (REVIEW) → TASK-025 (READY) → TASK-026 (READY).
