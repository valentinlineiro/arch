## TASK-086: Pluggable CLI registry in arch.conf
**Meta:** P2 | S | IN_PROGRESS | Focus:yes | 7-operations | local | scripts/arch.sh, arch.config.json

### Acceptance Criteria
- [ ] A `[clis]` section is added to `arch.config.json` listing each supported CLI with its `bin` and headless invocation template (using `{prompt}` placeholder).
- [ ] `scripts/arch.sh` reads the `[clis]` section from `arch.config.json`, iterates in order, finds the first available binary, and substitutes `{prompt}` — no hardcoded `if/elif` chain remains.
- [ ] Adding a new CLI requires only a new entry in `arch.config.json`, no shell changes.
- [ ] `conduct` and `exec` both use the registry.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
