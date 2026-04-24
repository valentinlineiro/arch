# DO.md
<!-- ARCH v0.2 — Combined EXEC and HUMAN modes -->
<!-- Purpose: Execute tasks from SPRINT.md or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git pull`.
2. Find highest priority `READY` task in `docs/SPRINT.md`.
3. Set status to `IN_PROGRESS`, add lock, and commit immediately.
4. Implement against Acceptance Criteria ONLY.
5. On completion: Status to `REVIEW`, stop.

## Intent: Human Operation (Human)
1. Interpret intent (Mark DONE, Start task, Block, Add to backlog, Move to sprint, Cancel).
2. Execute file operation (Atomic moves between BACKLOG and SPRINT).
3. Commit exactly once per operation.

## Constraints
- **Atomic commits:** Referencing TASK-ID.
- **Convention:** Follow `GUIDELINES.md` for commit prefixes.
