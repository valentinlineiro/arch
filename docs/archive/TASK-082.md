## TASK-082: Fix conduct/exec blocking on tool permissions for all CLIs
**Meta:** P0 | XS | DONE | Focus:yes | 7-operations | local | scripts/arch.sh

### Acceptance Criteria
- [x] `arch conduct` runs autonomously end-to-end without blocking on tool permission prompts (claude).
- [x] `arch exec` runs autonomously end-to-end without blocking on tool permission prompts (claude).
- [x] Gemini path uses `-p` (non-interactive) and `-y` (auto-approve) instead of interactive positional arg.
- [x] Dead `claude-code` branch removed (binary does not exist; `claude` is the correct one).

### Definition of Done
- [x] `scripts/arch.sh` updated for both `conduct` and `exec` cases, all supported CLIs.
- [x] `arch review` passes.
