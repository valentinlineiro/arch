# DISPATCH.md
Generated: 2026-04-23T00:00:00Z
Sprint: 1 | Health: 🟡 AT RISK — status drift makes true state ambiguous

---

## Immediate actions (human required)

- [ ] **Sync BACKLOG.md statuses** — 6 tasks have diverged from SPRINT.md. BACKLOG.md must be authoritative. Required corrections:
  - TASK-001: `BACKLOG` → `DONE`
  - TASK-002: `BACKLOG` → `READY`
  - TASK-003: `BACKLOG` → `READY`
  - TASK-004: `BACKLOG` → `READY`
  - TASK-005: `BACKLOG` → `READY`
  - TASK-009: `READY` → `DONE`
  — **Urgency: today** — downstream agents read BACKLOG.md for routing; wrong statuses cause incorrect picks.

- [ ] **Decide: add REFINEMENT.md to CONDUCTOR context budget** — the evaluation checklist checks `docs/REFINEMENT.md` for stale drafts, but it is not in the declared context budget. Either add it to the budget or remove the check from the protocol. — **Urgency: this sprint**

---

## Agent invocations (ready to run)

1. `claude` EXEC TASK-002 — context: `agents/EXEC.md` + `TASK-002 (SPRINT.md)` + `docs/adr/ADR-000-template.md` — reason: P1, READY, no dependencies; unblocks TASK-003
2. `claude` EXEC TASK-005 — context: `agents/EXEC.md` + `TASK-005 (SPRINT.md)` + `all docs/agents/*.md` — reason: P1, READY, independent; can run in parallel with TASK-002
3. `codex` EXEC TASK-004 — context: `agents/EXEC.md` + `TASK-004 (SPRINT.md)` + `scripts/arch-install.sh` — reason: P1, READY, TASK-001 dependency satisfied; gates TASK-010
4. `claude` EXEC TASK-003 — context: `agents/EXEC.md` + `TASK-003 (SPRINT.md)` + `docs/adr/ADR-000-template.md` + `docs/adr/ADR-001-git-as-operating-system.md` — reason: P1, **run only after TASK-002 is merged**
5. `codex` EXEC TASK-010 — context: `agents/EXEC.md` + `TASK-010 (SPRINT.md)` + `scripts/arch-install.sh` + `TASK-004` — reason: P0, **run only after TASK-004 is published to npm**

---

## Maintenance actions

- None. No stale IN_PROGRESS locks detected (no tasks currently IN_PROGRESS).

---

## Flags for next planning session

- **TASK-010 (P0) dependency-gated** — cannot start until TASK-004 (npx arch-init) is DONE. If TASK-004 slips, TASK-010 is at risk. Monitor TASK-004 progress closely.
- **TASK-003 serialized behind TASK-002** — both assigned to `claude`; consider whether they can be drafted in parallel and merged independently.
- **Sprint velocity baseline** — Sprint 1, day 0. 2/7 tasks DONE. No historical baseline yet; flag any estimate misses at close for RETRO-001 calibration.
- **TASK-007 (RETRO write)** — depends on TASK-001 through TASK-005 all DONE; earliest start ≈ 2026-05-05.
- **REFINEMENT.md not evaluated** — outside CONDUCTOR context budget; confirm whether any DRAFT items are pending.
