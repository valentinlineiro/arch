# DO.md
<!-- ARCH v0.3 — Modular Execution -->
<!-- Purpose: Execute tasks from sprint/ or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git fetch` (sync state safely without merging). History-changing operations (`git pull`, `git merge`, `git rebase`) require explicit human approval.
2. Find highest priority `READY` task in `docs/tasks/`.
   - **Automated Selection:** Run `arch next` to identify the deterministic candidate.
   - If `arch next` returns a TASK-ID: select it.
   - If `arch next` fails (exit 1): no unblocked tasks available — halt and wait for human instruction or THINK replenishment.
3. Set status to `IN_PROGRESS`, add lock in Meta line, and commit immediately.
4. Implement against Acceptance Criteria ONLY.
5. On completion: Status to `REVIEW`, stop.

## Intent: Human Operation (Human)
1. Interpret intent (Mark DONE, Start task, Block, Add to backlog, Move to sprint, Cancel, Add idea).
2. **Before creating any new task:** search title keywords across `docs/tasks/` and `docs/archive/`. If one or more matches found: list them and halt — wait for explicit human confirmation before proceeding. If no matches: proceed normally.
3. **If input starts with `idea:` or contains `add idea:`:**
   - Derive a slug from the idea text (lowercase, hyphens, max 5 words).
   - Create `docs/refinement/IDEA-[slug].md` using the template in `docs/refinement/TEMPLATE.md`.
   - Commit immediately in the same operation with: `idea: add draft [slug] to refinement`.
   - Registration is not complete until that commit succeeds. Do not leave the draft as an uncommitted worktree change.
   - Stop after the commit — do not add to backlog, do not set status to READY.
   - Report: `"Draft created at docs/refinement/IDEA-[slug].md. Run arch think to evaluate."`
   - **Promoting a draft requires explicit human instruction:** `arch do "promover IDEA-[slug]"`.
4. When marking DONE: add `Closed-at: <ISO 8601 timestamp>` to the task file. If the task required more than one implementation cycle, also add `Iterations: N`.
5. Execute file operation:
   - Move tasks between `docs/tasks/` and `docs/archive/`. Change `Focus:yes/no` to adjust active queue.
   - Update Meta lines in individual task files.
6. Commit exactly once per operation.

## Constraints
- **Atomic commits:** Referencing TASK-ID.
- **Exception:** idea-draft registration uses the `idea:` commit prefix and is exempt from TASK-ID because no task exists yet.
- **Commit prefix (mandatory before every commit):** Select the type from the table in `docs/guidelines/core.md`. If no type fits exactly, pick the closest and append a one-line justification in the commit message body. Applies to all commits: lock, implementation, completion.
