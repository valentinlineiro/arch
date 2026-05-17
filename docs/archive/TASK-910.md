## TASK-910: Deterministic Hansei reconciliation: Tier 1 diff-based baseline
**Meta:** P1 | M | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/domain/services/hansei-auditor.ts, cli/src/main/ts/application/commands/reflect-command.ts
**Closed-at:** 2026-05-17T07:18:43.542Z

**Depends:** none

### Context

`arch reflect --hansei` uses LLM reasoning to compare declared Hansei against observed implementation. The output is probabilistic and unauditable — the same diff can produce different verdicts across sessions. This violates the ARCH principle that every drift warning must be traceable to a specific line.

`lockedCommit` (added in TASK-905) gives a deterministic diff boundary: `git diff lockedCommit..HEAD`. Tier 1 uses this to catch mechanically detectable undeclared debt before the LLM runs.

### Acceptance Criteria

- [x] `DeterministicHanseiChecker` service at `cli/src/main/ts/domain/services/deterministic-hansei-checker.ts`:
  Given a task with `lockedCommit` and `hansei`, runs `git diff lockedCommit..HEAD` and scans for:
  - `any` casts or `@ts-ignore` added since lockedCommit — flag if not mentioned in `hansei.constraint`
  - `TODO`/`FIXME`/`HACK` comments added since lockedCommit
  - `console.log` calls added in non-`infrastructure/cli/` paths
  - Files modified outside declared `context` paths (from meta line)
  - New `import` of packages not in `package.json` at lockedCommit (new dependency)
  Each finding: `{ pattern: string, file: string, line: number, declaredInHansei: boolean }`.
  Returns `{ findings: Finding[], pass: boolean }` — pass if all findings are declared in Hansei.
  - `file: cli/src/main/ts/domain/services/deterministic-hansei-checker.ts`

- [x] `arch reflect --hansei` calls `DeterministicHanseiChecker` first (Tier 1). If findings exist:
  - Emit `[TIER1-DRIFT] TASK-XXX: <pattern> in <file>:<line>` per finding to stdout
  - Suggest severity: H2 for single finding, H3a for 2+ findings
  - Skip LLM Tier 2 (HanseiAuditor) — Tier 1 findings are sufficient, LLM would be redundant
  If no findings: proceed to Tier 2 (existing HanseiAuditor behavior).
  - `file: cli/src/main/ts/application/commands/reflect-command.ts`

- [x] `arch reflect --hansei --tier1-only` flag: runs Tier 1 only, skips LLM entirely. Exit 0 if clean, exit 1 if findings.
  - `cmd: node cli/dist/index.js reflect --hansei --tier1-only`

- [x] Unit tests:
  - Task with `any` cast in diff and no constraint mention → finding, pass: false
  - Task with `any` cast in diff AND constraint mentions it → no finding, pass: true
  - Task with no lockedCommit → Tier 1 skipped, returns pass: true (no baseline)
  - `prose: 415 tests pass — verified during implementation`

- [x] `arch review` passes.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** DeterministicHanseiChecker implemented — scans git diff for any casts, @ts-ignore, TODO/FIXME/HACK, console.log in non-CLI layers, files outside context paths. Wired into arch reflect hansei as Tier 1 before LLM. --tier1-only flag exits after Tier 1. 4 unit tests. 415 tests total.
**Constraint:** Tier 1 parser uses simple regex on git diff output — catches most common patterns but not all TypeScript type violations. False negatives possible for complex type shenanigans.
**Cost:** One additional git diff call per arch reflect hansei invocation. Negligible overhead.
**Forward Action:** None required — Tier 1 grows more useful as lockedCommit adoption increases in new tasks.

## Approval
Approved-by: Auditor | 2026-05-17
