# DISPATCH.md
Generated: 2026-04-23T00:00:00Z
Sprint: 1 | Health: 🟢 GREEN

---

## Immediate actions (human required)

- [x] **Pull TASK-013 into Sprint 1** — Done. TASK-013 moved to SPRINT.md as READY.
- [x] **Confirm parallel execution preference for TASK-002 / TASK-004 / TASK-005** — Confirmed: all three can run in parallel.

---

## Agent invocations (ready to run)

1. `codex` EXEC TASK-004 — context: `agents/EXEC.md` + `TASK-004` + `scripts/arch-install.sh` — reason: P1, READY, critical path; TASK-010 (P0) cannot start until `arch-init` is published to npm — **can run in parallel with TASK-002 and TASK-005**
2. `claude` EXEC TASK-002 — context: `agents/EXEC.md` + `TASK-002` + `docs/adr/ADR-000-template.md` — reason: P1, READY, no dependencies; unblocks TASK-003 — **can run in parallel with TASK-004 and TASK-005**
3. `claude` EXEC TASK-005 — context: `agents/EXEC.md` + `TASK-005` + `docs/agents/*.md` — reason: P1, READY, fully independent — **can run in parallel with TASK-002 and TASK-004**
4. `claude` EXEC TASK-013 — context: `agents/EXEC.md` + `TASK-013` + `docs/agents/HUMAN.md` — reason: P1, READY, no dependencies; patches HUMAN protocol dual-file drift
5. *(after TASK-002 DONE)* `claude` EXEC TASK-003 — context: `agents/EXEC.md` + `TASK-003` + `docs/adr/ADR-000-template.md` + `docs/adr/ADR-001-git-as-operating-system.md` — reason: P1, depends on TASK-002
6. *(after TASK-004 published to npm)* `codex` EXEC TASK-010 — context: `agents/EXEC.md` + `TASK-010` + `scripts/arch-install.sh` + `TASK-004` — reason: P0, unblocked once arch-init is live on npm

---

## Maintenance actions

- None. No IN_PROGRESS tasks detected — no stale locks to clear.
- Low-priority: backfill AC/DoD checkboxes in BACKLOG.md for TASK-001 and TASK-009 (checked in SPRINT.md, unchecked in BACKLOG.md). HUMAN mode can do this in one commit. Root fix is TASK-013.

---

## Flags for next planning session

- **TASK-010 (P0) gated on npm publish** — DONE on TASK-004 requires confirming the package is live on npm, not just merged. Verify CI/publish pipeline exists before closing TASK-004.
- **TASK-007 (RETRO write)** depends on TASK-001, TASK-002, TASK-003, TASK-004, TASK-005 all DONE — earliest start ≈ 2026-05-03; plan retro window for late sprint.
- **No retro history yet** — Sprint 1 day 1, no velocity baseline. Flag all size estimates at close for RETRO-001 calibration.
- **REFINEMENT.md clear** — no active draft, no stale items. Refinement queue healthy.
