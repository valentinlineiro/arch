## TASK-205: Extend executable ACs - file:, grep:, prose: predicates + Auditor bypass
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, docs/TASK-FORMAT.md, docs/agents/DO.md
**Closed-at:** 2026-05-12T08:16:21.027Z
**Depends:** none

## Hansei
The initial implementation of the `file:` and `grep:` predicates in tests failed due to path resolution issues relative to the test runner's CWD. Switching to a temporary directory with controlled file creation fixed the flakiness. Extending the validation to detect missing predicates successfully closes the quality gap for executable documentation.
