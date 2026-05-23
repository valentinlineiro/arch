## TASK-962: Fix arch task done to scope unchecked AC check to Acceptance
**Meta:** P1 | XS | DONE | Focus:false | 2-code-generation | local | docs/tasks/
**Closed-at:** 2026-05-20T14:16:19.694Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [ReviewBlindspot]
**Decision:** Implementation was a one-function extraction mirroring the existing ValidateTaskAcs.extractACSections pattern. Initial TDD attempt used stdout capture to detect the bug signal, but fmt.fail writes to console.log (stdout) which interfered with the test runner's own output stream. Switched to testing the extracted helper function directly — cleaner isolation with no side effects.
**Constraint:** The stdout-capture approach is unreliable in node:test because the runner writes results to the same stream during test execution.
**Cost:** One iteration to correct the test approach before GREEN.
**Forward Action:** None required.
