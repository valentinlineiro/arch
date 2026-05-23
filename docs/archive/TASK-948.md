## TASK-948: Enhance CLI UX with interactivity and local dashboard
**Meta:** P3 | S | DONE | Focus:no | 7-operations | local | docs/tasks/
**Closed-at:** 2026-05-19T08:13:08.165Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [DeferredTest]
**Decision:** Four bugs introduced in the serve command were not caught before review: query strings caused ENOENT, async Promise.all rejection was unhandled (crash risk on Node ≥ 15), port conflict produced a raw stack trace, and port parsing accepted partially-numeric args. None were caught because serve-command had only a smoke test (instantiation check). Review caught all four.
**Constraint:** HTTP handler logic is inline in execute(), making it untestable without a running server. Extracting createHandler() and parsePort() as methods was the prerequisite for meaningful tests.
**Cost:** Additional review cycle required. Six tests added covering the critical and important paths.
**Forward Action:** None required.
