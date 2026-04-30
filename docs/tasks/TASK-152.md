## TASK-152: Implement arch loop - autonomous execution engine
**Meta:** P1 | L | REVIEW | Focus:no | 2-code-generation | claude | cli/src/, docs/agents/DO.md, docs/agents/THINK.md, arch.config.json
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [x] Create `cli/src/main/ts/application/use-cases/loop-engine.ts` implementing the cycle: `arch govern` → `arch exec` → `arch review` → archive → repeat.
- [x] Each phase (`govern`, `exec`, `review`) is invoked as a clean subprocess so context does not bleed between tasks.
- [x] On Andon Cord condition (review fails 3×, budget exceeded, protected path touched): write `ANDON_HALT` entry to `docs/INBOX.md` and exit non-zero.
- [x] On HITL gate (AWAITING_APPROVAL, AWAITING_REVIEW): write typed entry to `docs/INBOX.md` and exit. Resumption via `arch loop --resume`.
- [x] `arch loop --sprint <slug>` scopes execution to tasks tagged with that sprint only.
- [x] `arch loop --dry-run` plans the next cycle and prints it without committing anything.
- [x] Each completed task cycle captures `Cost:` and `Steps:` in the archived task meta line. (Implemented in logic, though simulated in dry-run)
- [x] Register `loop` command in `cli/src/main/ts/index.ts`.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch loop --dry-run` runs without error on the current repo.
- [x] `arch review` passes.
