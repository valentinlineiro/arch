## TASK-920: npm publish and verify npx arch init end-to-end
**Meta:** P2 | S | READY | Focus:no | 7-operations | human | cli/package.json

**Depends:** TASK-919

### Context

Final publish step. Requires npm credentials. Human-executed. Verify the full `npx arch init` flow works in a clean directory before tagging v0.8.0.

### Acceptance Criteria

- [ ] Version bumped to `0.8.0` in `cli/package.json` and `arch.config.json`.
  - `file: cli/package.json`

- [ ] `npm publish --access public` runs from `cli/` without errors.
  - `prose: human-executed with npm credentials`

- [ ] In a clean temp directory: `npx arch init` installs and runs. Scaffolded repo has all required dirs and TASK-001.md.
  - `prose: verified by human in clean env`

- [ ] `arch review` passes in the scaffolded repo after `npx arch init`.
  - `prose: verified in clean env`

- [ ] Git tag `v0.8.0` pushed.
  - `prose: tag pushed`

### Definition of Done
- [ ] All ACs checked by human
- [ ] `npx arch init` works end-to-end in clean directory

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
