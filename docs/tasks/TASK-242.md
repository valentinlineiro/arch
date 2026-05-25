## TASK-242: Ship CLI as standalone npm package
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude-code | cli/
**Depends:** none

### Context
Current CLI requires manual `npm install && npm run build` and Node.js runtime. Goal is simpler cross-platform installation via npm or pre-built binary.

### Acceptance Criteria
- [ ] CLI publishable as standalone npm package (or bundled binary via esbuild/pkg)
- [ ] Installation documented in README
- [ ] All existing commands work post-package
- [ ] Build pipeline produces distributable artifact

### Definition of Done
- [ ] All ACs verified.
- [ ] `arch review` passes.

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Legacy task predating mandatory Hansei. No implementation started — Hansei added to satisfy TaskTemplateCompliance linter.
**Constraint:** Task predates hanseiSinceTaskId threshold — Hansei is retroactively added.
**Cost:** No cost introduced — this is a template compliance fix only.
**Forward Action:** None required.
