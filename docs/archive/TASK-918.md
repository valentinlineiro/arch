## TASK-918: Audit cli/package.json for npm publish readiness
**Meta:** P2 | S | DONE | Focus:no | 7-operations | claude-code | cli/package.json, cli/.npmignore
**Closed-at:** 2026-05-17T21:37:37.132Z

**Depends:** TASK-917

### Context

`npx arch init` doesn't work because the CLI has never been published. Before publishing, `cli/package.json` needs correct `bin`, `main`, `exports`, and `files` fields. An `.npmignore` is needed to exclude source, tests, and node_modules from the tarball.

### Acceptance Criteria

- [x] `cli/package.json` has `"bin": { "arch": "dist/index.js" }`.
  - `file: cli/package.json`

- [x] `cli/package.json` has `"main": "dist/index.js"` and `"exports": { ".": "./dist/index.js" }`.
  - `file: cli/package.json`

- [x] `cli/package.json` has `"files": ["dist/", "README.md"]` — excludes `src/`, `node_modules/`, test files.
  - `file: cli/package.json`

- [x] `cli/.npmignore` created: excludes `src/`, `*.test.ts`, `.env`, `coverage/`.
  - `file: cli/.npmignore`

- [x] `npm pack --dry-run` from `cli/` lists only `dist/` files and README. No source files in tarball.
  - `prose: verified by running npm pack --dry-run`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** package.json fixed: bin={arch:dist/index.js}, main=dist/index.js, exports={.}, files=[dist/,README.md], name=arch-cli. .npmignore created excluding src/, tests, config. npm pack --dry-run confirms clean 73KB tarball with only dist/ files.
**Constraint:** Package name "arch-cli" — verify availability on npm before publish (TASK-920).
**Cost:** No architectural debt introduced — packaging only.
**Forward Action:** None required.
