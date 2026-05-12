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
