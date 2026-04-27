## TASK-049: Ignorar artefactos runtime locales como .codex
**Meta:** P2 | XS | DONE | Focus:no | 7-operations | human | .gitignore, .git/info/exclude, docs/guidelines/
**Depends:** none

### Acceptance Criteria
- [x] Define where local runtime artifacts should be ignored (`.gitignore` repo vs `.git/info/exclude` local)
- [x] Add a concrete rule for `.codex` in the chosen location
- [x] Document the decision if it affects other operators or agents

### Definition of Done
- [x] Worktree no longer shows `.codex` as recurring noise in the expected environment
- [ ] PR approved or local decision consciously applied
