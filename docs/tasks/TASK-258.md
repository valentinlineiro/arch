## TASK-258: Resolve arch review warning - Large git diff
**Meta:** P2 | XS | READY | Focus:no | 7-operations | local | .git/

### Context
`arch review` reports a warning: "Warning: Large git diff detected. Ensure commits remain atomic."
This usually happens when too many changes are accumulated without being committed, or if a single commit is too large.

### Acceptance Criteria

- [ ] Identify the cause of the large diff (staged vs unstaged vs commit size).  →  prose: root cause documented in Hansei
- [ ] Reduce diff size through atomic commits or targeted exclusion.  →  prose: diff no longer large
- [ ] `arch review` no longer emits the large-diff warning.  →  cmd: arch review; grep: no large diff warning
- [ ] Hansei recorded at close.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
