# Halt Conditions

This table centralizes all conditions under which the ARCH system or an agent MUST halt execution.

| Condition | Trigger command | CLI exit code | HALT-LOG entry format |
|-----------|-----------------|---------------|-----------------------|
| No READY tasks available | `arch next` | 1 | `[TIMESTAMP] HALT | NO_READY_TASKS | No tasks found in READY status.` |
| Stale lock (> 3 days) | `arch next` | 1 | `[TIMESTAMP] HALT | STALE_LOCK | TASK-XXX has been locked since YYYY-MM-DD.` |
| Highest-priority task blocked | `arch next` | 1 | `[TIMESTAMP] HALT | TASK_BLOCKED | TASK-XXX is blocked by unresolved dependencies: YYYY, ZZZZ.` |
| Predicate failure | `arch task start/review` | 1 | `[TIMESTAMP] HALT | PREDICATE_FAIL | TASK-XXX: AC "<Description>" failed.` |
| Unchecked ACs at close | `arch task done` | 1 | `[TIMESTAMP] HALT | UNCHECKED_ACS | TASK-XXX has pending ACs.` |
| Missing Hansei (post-rollout) | `arch task done` | 1 | `[TIMESTAMP] HALT | MISSING_HANSEI | TASK-XXX (post-rollout) is missing ## Hansei section.` |
| System integrity violation | `arch review` | 1 | `[TIMESTAMP] HALT | REVIEW_FAIL | Violation: <Violation description>` |
