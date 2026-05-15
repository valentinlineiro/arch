## TASK-271: Integrate OpenClaw as mobile bridge for ARCH status and commands
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude | docs/agents/DO.md, arch.config.json

### Context

ARCH requires a terminal session for all commands with no mobile access. OpenClaw (https://openclaw.ai/) can serve as a thin mobile-to-terminal bridge, enabling users to check `arch review` status, receive drift alerts, and trigger commands from a mobile device via messaging apps. ARCH commands map cleanly as OpenClaw skills.

### Acceptance Criteria

- [ ] OpenClaw integration documented with at least a notification channel skill (`arch review` output forwarded) and a status query skill.
- [ ] Setup instructions exist in `docs/` or `README` for configuring the ARCH-OpenClaw bridge.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] OpenClaw skill definitions and setup instructions created and verified functional.
- [ ] `arch review` passes.
