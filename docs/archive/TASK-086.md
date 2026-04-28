## TASK-086: Pluggable CLI registry in arch.conf
**Meta:** P2 | S | 5 | DONE | Focus:yes | 7-operations | local | scripts/arch.sh, arch.config.json

### Acceptance Criteria
- [x] A `[clis]` section is added to `arch.config.json` listing each supported CLI with its `bin` and headless invocation template (using `{prompt}` placeholder).
- [x] `scripts/arch.sh` reads the `[clis]` section from `arch.config.json`, iterates in order, finds the first available binary, and substitutes `{prompt}` — no hardcoded `if/elif` chain remains.
- [x] Adding a new CLI requires only a new entry in `arch.config.json`, no shell changes.
- [x] `conduct` and `exec` both use the registry.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
