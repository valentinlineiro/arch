## TASK-128: Fix arch conduct to use CLI instead of API
**Meta:** P0 | S | 5 | DONE | Focus:yes | 7-operations | local | scripts/arch.sh | gemini-cli
**Closed-at:** 2026-04-29T16:00:00Z

### Problem
The `arch conduct` command was using a direct agent invocation (internal API-like behavior) instead of calling the configured AI CLI via the standard TS CLI. This violated the ARCH principle of using local CLIs for AI interaction.

### Acceptance Criteria
- [x] Migrated `conduct` command from `scripts/arch.sh` to a dedicated `ConductCommand` in the TS CLI (`cli/src/main/ts/application/commands/conduct-command.ts`).
- [x] Refactored `scripts/arch.sh` to delegate `conduct` to the TS CLI binary.
- [x] Verified that `arch conduct` correctly routes to the primary CLI defined in `arch.config.json` by spawning the process with the configured template.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
