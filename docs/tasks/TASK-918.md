## TASK-918: Audit cli/package.json for npm publish readiness
**Meta:** P2 | S | READY | Focus:yes | 7-operations | claude-code | cli/package.json, cli/.npmignore

**Depends:** TASK-917

### Context

`npx arch init` doesn't work because the CLI has never been published. Before publishing, `cli/package.json` needs correct `bin`, `main`, `exports`, and `files` fields. An `.npmignore` is needed to exclude source, tests, and node_modules from the tarball.

### Acceptance Criteria

- [ ] `cli/package.json` has `"bin": { "arch": "dist/index.js" }`.
  - `file: cli/package.json`

- [ ] `cli/package.json` has `"main": "dist/index.js"` and `"exports": { ".": "./dist/index.js" }`.
  - `file: cli/package.json`

- [ ] `cli/package.json` has `"files": ["dist/", "README.md"]` — excludes `src/`, `node_modules/`, test files.
  - `file: cli/package.json`

- [ ] `cli/.npmignore` created: excludes `src/`, `*.test.ts`, `.env`, `coverage/`.
  - `file: cli/.npmignore`

- [ ] `npm pack --dry-run` from `cli/` lists only `dist/` files and README. No source files in tarball.
  - `prose: verified by running npm pack --dry-run`

- [ ] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes
- [ ] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [no-issue]
**Decision:** Not yet started.
**Constraint:** None.
**Cost:** None.
**Forward Action:** None.
