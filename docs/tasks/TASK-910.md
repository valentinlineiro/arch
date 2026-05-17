## TASK-910: Deterministic Hansei reconciliation: Tier 1 diff-based baseline
**Meta:** P1 | M | READY | Focus:yes | 1-code-reasoning | claude-code | cli/src/main/ts/domain/services/hansei-auditor.ts, cli/src/main/ts/application/commands/reflect-command.ts

**Depends:** none

### Context

`arch reflect --hansei` uses LLM reasoning to compare declared Hansei against observed implementation. The output is probabilistic and unauditable — the same diff can produce different verdicts across sessions. This violates the ARCH principle that every drift warning must be traceable to a specific line.

`lockedCommit` (added in TASK-905) gives a deterministic diff boundary: `git diff lockedCommit..HEAD`. Tier 1 uses this to catch mechanically detectable undeclared debt before the LLM runs.

### Acceptance Criteria

- [ ] `DeterministicHanseiChecker` service at `cli/src/main/ts/domain/services/deterministic-hansei-checker.ts`:
  Given a task with `lockedCommit` and `hansei`, runs `git diff lockedCommit..HEAD` and scans for:
  - `any` casts or `@ts-ignore` added since lockedCommit — flag if not mentioned in `hansei.constraint`
  - `TODO`/`FIXME`/`HACK` comments added since lockedCommit
  - `console.log` calls added in non-`infrastructure/cli/` paths
  - Files modified outside declared `context` paths (from meta line)
  - New `import` of packages not in `package.json` at lockedCommit (new dependency)
  Each finding: `{ pattern: string, file: string, line: number, declaredInHansei: boolean }`.
  Returns `{ findings: Finding[], pass: boolean }` — pass if all findings are declared in Hansei.
  - `file: cli/src/main/ts/domain/services/deterministic-hansei-checker.ts`

- [ ] `arch reflect --hansei` calls `DeterministicHanseiChecker` first (Tier 1). If findings exist:
  - Emit `[TIER1-DRIFT] TASK-XXX: <pattern> in <file>:<line>` per finding to stdout
  - Suggest severity: H2 for single finding, H3a for 2+ findings
  - Skip LLM Tier 2 (HanseiAuditor) — Tier 1 findings are sufficient, LLM would be redundant
  If no findings: proceed to Tier 2 (existing HanseiAuditor behavior).
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`

- [ ] `arch reflect --hansei --tier1-only` flag: runs Tier 1 only, skips LLM entirely. Exit 0 if clean, exit 1 if findings.
  - `cmd: node cli/dist/index.js reflect --hansei --tier1-only`

- [ ] Unit tests:
  - Task with `any` cast in diff and no constraint mention → finding, pass: false
  - Task with `any` cast in diff AND constraint mentions it → no finding, pass: true
  - Task with no lockedCommit → Tier 1 skipped, returns pass: true (no baseline)
  - `cmd: npm test`

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
