## TASK-062: Avoid arch command collision by standardizing on ./scripts/arch.sh
**Meta:** P0 | S | 5 | DONE | Focus:yes | 6-writing | local | AGENTS.md, docs/, scripts/, README.md

### Acceptance Criteria
- [x] Update `AGENTS.md` to recommend `./scripts/arch.sh` for local operations.
- [x] Update `README.md` and onboarding instructions to use `./scripts/arch.sh`.
- [x] Audit `docs/` for any legacy `arch` command references and update them.
- [x] Verify that `./scripts/arch.sh` correctly wraps the CLI and handles arguments.

### Definition of Done
- [x] Documentation aligns with the local invocation strategy.
- [x] No global `arch` collisions reported during standard onboarding flow.

