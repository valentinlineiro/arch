## TASK-132: Implement 'arch promote' command for easier IDEA promotion
**Meta:** P3 | S | DONE | Focus:yes | 2-code-generation | local | cli/, scripts/arch.sh
**Closed-at:** 2026-04-30T09:29:36.519Z
**Depends:** none

### Acceptance Criteria
- [x] Add `arch promote [IDEA-slug]` command to `scripts/arch.sh`.
- [x] Implement `PromoteCommand` in `cli/src/main/ts/application/commands/promote-command.ts`.
- [x] The command should:
  - [x] Validate IDEA existence.
  - [x] Suggest the next TASK-ID.
  - [x] Interactively (or via flag) confirm promotion.
  - [x] Perform file movements and status updates automatically.
  - [x] Commit the promotion with `feat: promote [IDEA-slug] to [TASK-ID]`.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
