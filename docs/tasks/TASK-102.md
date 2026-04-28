## TASK-102: arch govern - autonomous self-balancing loop
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 7-operations | local | scripts/arch.sh, arch.config.json, docs/agents/
**Depends:** TASK-087, TASK-088

### Acceptance Criteria
- [ ] `arch govern` command added to `scripts/arch.sh` and documented in usage.
- [ ] Governance state (exec count since last conduct, per-task starvation counter) is derived from git log — no external state file. Exec count = commits with `[TASK-XXX]` since last commit containing `[THINK]`; starvation = conduct cycles since task appeared in READY without being picked.
- [ ] Rule 1 — Critical first: if any P0 READY task exists, `govern` targets it unconditionally.
- [ ] Rule 2 — Replenishment: if READY < 3, `govern` runs `arch conduct` before any exec.
- [ ] Rule 3 — Conduct cadence: if exec count since last conduct ≥ N (default 3, configurable in `arch.config.json` as `governance.conductEveryN`), `govern` runs `arch conduct` first.
- [ ] Rule 4 — Focus rotation: after each exec completes, `govern` clears Focus:yes on the done task and sets it on the next picked task automatically.
- [ ] Rule 5 — Starvation detection: if a P1 task has been READY for ≥ K conduct cycles (default 5, configurable as `governance.starvationCycles`), `govern` escalates it to P0 and emits a `[GOVERNANCE]` log entry.
- [ ] Human escape hatches preserved: BLOCKED tasks are skipped by governance; manually set Focus:yes overrides governance pick; PRs are never merged automatically.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
