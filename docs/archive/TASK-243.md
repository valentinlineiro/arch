## TASK-243: Consolidate test mocks into shared module to prevent interface drift
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/test/ts/
**Closed-at:** 2026-05-14T00:00:00Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SymbolDiscovery]

**Decision:**
Retained `written` as a separate write-tracking field on `MockFileSystem` rather than unifying it with `files`, after test assertions in `build-index` and `context-inference` showed direct dependency on post-write state tracking. Also discovered `process.chdir` is required to make `GitCli` operate in an isolated temp dir.

**Constraint:**
Migrating those test assertions to use `files` directly would have required restructuring unrelated test logic, expanding scope beyond the consolidation goal.

**Cost:**
No debt introduced. The `written`/`files` separation reflects a legitimate test-layer concern: distinguishing "what was written" from "current filesystem state." The `process.chdir` pattern is a known race risk under parallel execution.

**Forward Action:**
The `process.chdir` isolation pattern should be resolved by exposing a `cwd` parameter on `GitCli` constructor — deferred to a future task.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
