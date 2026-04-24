# DO.md
<!-- ARCH v0.3 — Modular Execution -->
<!-- Purpose: Execute tasks from sprint/ or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git pull`.
2. Find highest priority `READY` task in `docs/tasks/sprint/`.
3. Set status to `IN_PROGRESS`, add lock in Meta line, and commit immediately.
4. Implement against Acceptance Criteria ONLY.
5. On completion: Status to `REVIEW`, stop.

## Intent: Human Operation (Human)
1. Interpret intent (Mark DONE, Start task, Block, Add to backlog, Move to sprint, Cancel).
2. Execute file operation:
   - Move tasks between `docs/tasks/backlog/`, `docs/tasks/sprint/`, and `docs/archive/`.
   - Update Meta lines in individual task files.
3. Commit exactly once per operation.

## Constraints
- **Atomic commits:** Referencing TASK-ID.
- **Convention:** Follow guidelines in `docs/guidelines/` for commit prefixes.
