## TASK-258: Resolve arch review warning - Large git diff
**Meta:** P2 | XS | READY | Focus:no | 7-operations | local | .git/

### Context
`arch review` reports a warning: "Warning: Large git diff detected. Ensure commits remain atomic."
This usually happens when too many changes are accumulated without being committed, or if a single commit is too large.

### Acceptance Criteria
- AC1: identify the cause of the large diff (staged vs unstaged vs size)
- AC2: reduce diff size through atomic commits or targeted exclusion
- AC3: `arch review` no longer emits the warning
- AC4: Hansei recorded
