## TASK-918: Audit cli/package.json for npm publish readiness
**Meta:** P2 | S | DONE | Focus:no | 7-operations | claude-code | cli/package.json, cli/.npmignore
**Closed-at:** 2026-05-17T21:37:37.132Z
**Depends:** TASK-917

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** package.json fixed: bin={arch:dist/index.js}, main=dist/index.js, exports={.}, files=[dist/,README.md], name=arch-cli. .npmignore created excluding src/, tests, config. npm pack --dry-run confirms clean 73KB tarball with only dist/ files.
**Constraint:** Package name "arch-cli" — verify availability on npm before publish (TASK-920).
**Cost:** No architectural debt introduced — packaging only.
**Forward Action:** None required.
