## TASK-103: Cost routing - class-based provider and model-tier selection
**Meta:** P1 | S | READY | Focus:no | 7-operations | local | scripts/arch.sh, arch.config.json
**Depends:** TASK-086

### Acceptance Criteria
- [ ] `arch.config.json` routing map is honoured by `arch exec`: the CLI used for a task is determined by its class field (e.g. `6-writing` → gemini, `1-code-reasoning` → claude), not hardcoded.
- [ ] A `governance.modelTiers` map is added to `arch.config.json` specifying model overrides by task size: `{ "XS": "claude-haiku-...", "S": "claude-sonnet-...", "M": "claude-sonnet-...", "L": "claude-opus-..." }`.
- [ ] `arch exec` reads the focused task's size from its Meta line and passes the corresponding `--model` flag to the CLI invocation.
- [ ] `conduct` and `exec` are explicitly excluded from class-based routing — they always use the primary configured AI CLI regardless of their operation class.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
