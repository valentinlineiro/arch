## TASK-206: Split monorepo into arch-protocol, arch-cli, arch-web repositories
**Meta:** P3 | M | READY | Focus:yes | 7-operations | human | docs/, cli/, arch.config.json
**Depends:** none

### Context
Protocol and CLI currently share a repo, coupling their release cycles. Web tooling is mixed in with protocol docs. This task separates them into three repos with `@arch/protocol` as a versioned npm package. All Angular/arch-web tasks are blocked until this task is complete.

### Acceptance Criteria
- [ ] `arch-protocol` repo created: contains docs/, arch.config.json schema, AGENTS.md, guidelines/ → prose: verified by checking repo exists and contains correct files
- [ ] `@arch/protocol` published to npm (or local registry for testing) → prose: verified by running npm install @arch/protocol
- [ ] `arch-cli` repo created: contains cli/ source, package.json; consumes `@arch/protocol` as a versioned dependency → prose: verified by checking package.json dependencies
- [ ] `arch-web` repo created as a skeleton: placeholder for Angular control panel and arch-*.html tooling → prose: verified by checking repo exists
- [ ] All Angular tasks in `docs/tasks/` have `**Depends:** TASK-206` added → prose: verified by grepping tasks for Angular references
- [ ] `arch review` passes in the new `arch-cli` repo → prose: verified by running arch review in arch-cli
- [ ] Migration guide written in `docs/` explaining how existing ARCH instances upgrade → file: docs/MIGRATION.md

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes in `arch-cli`.
- [ ] Migration guide published.

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Legacy task predating mandatory Hansei. No implementation started — Hansei added to satisfy TaskTemplateCompliance linter.
**Constraint:** Task predates hanseiSinceTaskId threshold — Hansei is retroactively added.
**Cost:** No cost introduced — this is a template compliance fix only.
**Forward Action:** None required.
