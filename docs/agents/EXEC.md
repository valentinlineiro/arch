# EXEC.md
<!-- Execution protocol — load for every task in SPRINT.md -->
<!-- ~200 tokens | Part of every task's context-budget -->

## Protocol
1. `git pull` — ensure you have latest state
2. Read `docs/SPRINT.md` — find highest-priority `READY` task
3. Commit: change task status to `IN_PROGRESS` + `locked-by: [session]` + `locked-at: [ISO]`
4. `git push` — if push fails, another agent took it; `git pull` and re-select
5. Implement against Acceptance Criteria only — no additional scope
6. Self-review: does output satisfy every AC checkbox?
7. Commit artifacts: `git add` all task-related changes (excluding status updates) + `git commit -m "[TASK-ID] implementation of ACs"`. Stop — artifact commit must be independent.
8. Commit: change status to `REVIEW`
9. Open PR: title format `[task-class] task title [TASK-ID]`
10. Stop — do not select another task in the same session

## Constraints
- Read only files declared in task's `Context-budget`
- If a file in `Context-budget` doesn't exist: flag in PR, don't assume content
- If AC is ambiguous: add a comment to the task in `SPRINT.md`, set status to `BLOCKED`
- Lock TTL is 4 hours — if you cannot finish, revert status to `READY` and remove lock
- Do not modify `docs/` except task status fields
