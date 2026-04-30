## TASK-152: Implement arch loop - autonomous execution engine
**Meta:** P1 | L | IN_PROGRESS | Focus:yes | 2-code-generation | claude | cli/src/, docs/agents/DO.md, docs/agents/THINK.md, arch.config.json | lock:gemini
**Sprint:** sprint/v0.7-foundations

### Acceptance Criteria
- [ ] Create `cli/src/main/ts/application/use-cases/loop-engine.ts` implementing the cycle: `arch govern` → `arch exec` → `arch review` → archive → repeat.
- [ ] Each phase (`govern`, `exec`, `review`) is invoked as a clean subprocess so context does not bleed between tasks.
- [ ] On Andon Cord condition (review fails 3×, budget exceeded, protected path touched): write `ANDON_HALT` entry to `docs/INBOX.md` and exit non-zero.
- [ ] On HITL gate (AWAITING_APPROVAL, AWAITING_REVIEW): write typed entry to `docs/INBOX.md` and exit. Resumption via `arch loop --resume`.
- [ ] `arch loop --sprint <slug>` scopes execution to tasks tagged with that sprint only.
- [ ] `arch loop --dry-run` plans the next cycle and prints it without committing anything.
- [ ] Each completed task cycle captures `Cost:` and `Steps:` in the archived task meta line.
- [ ] Register `loop` command in `cli/src/main/ts/index.ts`.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch loop --dry-run` runs without error on the current repo.
- [ ] `arch review` passes.
