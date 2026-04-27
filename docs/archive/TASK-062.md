## TASK-062: Avoid arch command collision by standardizing on ./scripts/arch.sh
**Meta:** P0 | S | DONE | Focus:yes | 6-writing | local | AGENTS.md, docs/, scripts/, README.md

### Acceptance Criteria
- [ ] Update `AGENTS.md` to recommend `./scripts/arch.sh` for local operations.
- [ ] Update `README.md` and onboarding instructions to use `./scripts/arch.sh`.
- [ ] Audit `docs/` for any legacy `arch` command references and update them.
- [ ] Verify that `./scripts/arch.sh` correctly wraps the CLI and handles arguments.

### Definition of Done
- [ ] Documentation aligns with the local invocation strategy.
- [ ] No global `arch` collisions reported during standard onboarding flow.
