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
1. Interpret intent (Mark DONE, Start task, Block, Add to backlog, Move to sprint, Cancel, Add idea).
2. **Before creating any new task:** search title keywords across `docs/tasks/sprint/`, `docs/tasks/backlog/`, and `docs/archive/`. If one or more matches found: list them and halt — wait for explicit human confirmation before proceeding. If no matches: proceed normally.
3. **If input starts with `idea:` or contains `añade idea:`:**
   - Derive a slug from the idea text (lowercase, hyphens, max 5 words).
   - Create `docs/refinement/IDEA-[slug].md` using the template in `docs/refinement/TEMPLATE.md`.
   - Commit: `feat: add idea draft [slug] to refinement`.
   - Stop — do not add to backlog, do not set status to READY.
   - Report: `"Draft created at docs/refinement/IDEA-[slug].md. Run arch think to evaluate."`
   - **Promoting a draft requires explicit human instruction:** `arch do "promover IDEA-[slug]"`.
4. When marking DONE: if the task required more than one implementation cycle, add `Iterations: N` to the task file before archiving.
5. Execute file operation:
   - Move tasks between `docs/tasks/backlog/`, `docs/tasks/sprint/`, and `docs/archive/`.
   - Update Meta lines in individual task files.
6. Commit exactly once per operation.

## Constraints
- **Atomic commits:** Referencing TASK-ID.
- **Commit prefix (mandatory before every commit):** Select the type from the table in `docs/guidelines/core.md`. If no type fits exactly, pick the closest and append a one-line justification in the commit message body. Applies to all commits: lock, implementation, completion.
