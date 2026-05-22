## TASK-920: npm publish and verify npx arch init end-to-end
**Meta:** P2 | S | DONE | Focus:no | 7-operations | human | cli/package.json
**Closed-at:** 2026-05-22T14:45:00Z

**Depends:** TASK-919

### Context

Final publish step. Requires npm credentials. Human-executed. Verify the full `npx arch init` flow works in a clean directory before tagging v0.8.0.

### Acceptance Criteria

- [x] Version bumped to `0.8.0` in `cli/package.json` and `arch.config.json`.
  - `file: cli/package.json`

- [x] `npm publish --access public` runs from `cli/` without errors.
  - `prose: human-executed with npm credentials`

- [x] In a clean temp directory: `npx arch init` installs and runs. Scaffolded repo has all required dirs and TASK-001.md.
  - `prose: verified by human in clean env`

- [x] `arch review` passes in the scaffolded repo after `npx arch init`.
  - `prose: verified in clean env`

- [x] Git tag `v0.8.0` pushed.
  - `prose: tag pushed`

### Definition of Done
- [x] All ACs checked by human
- [x] `npx arch init` works end-to-end in clean directory

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** First ARCH CLI release published to npm under v0.8.0, npx arch init verified in clean directory.
**Constraint:** Requires npm credentials and access — human-executed only.
**Cost:** Standard npm publish cost, no unexpected expense.
**Forward Action:** None.
