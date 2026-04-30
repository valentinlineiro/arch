# DO.md
<!-- ARCH v0.6.0 — Modular Execution -->
<!-- Purpose: Execute tasks from docs/tasks/ or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git fetch` (sync state safely without merging).
2. Find highest priority `READY` task in `docs/tasks/`.
   - **Automated Selection:** Run `arch next` to identify the deterministic candidate.
3. Set status to `IN_PROGRESS`, add lock in Meta line, and commit immediately.
4. Implement against Acceptance Criteria ONLY.
5. On completion: Status to `REVIEW`, stop.

## Intent: Operations (Ops)
1. **Manual Task/Idea Management:**
   - Interpret intent (Mark DONE, Start task, Block, Add idea).
   - **New Task Guard:** Search title keywords before creation. If match found, halt for confirmation.
   - **Idea Drafts:** If input starts with `idea:`, create `docs/refinement/IDEA-[slug].md` and commit immediately with `idea: add draft [slug]`.
   - **Archive/Move:** Move files between `tasks/` and `archive/`. Update `Focus:yes/no`. Commit once per op.
   - **Marking DONE:** Add `Closed-at` timestamp.
2. **Sprint Close:**
   - **Trigger:** Human declares sprint complete.
   - **Verify:** Confirm all sprint tasks are `DONE` in `docs/archive/`.
   - **Summary:** Signal THINK mode to generate `docs/METRICS.md` entry.
   - **Clear:** Set `"currentSprint": ""` in `arch.config.json` and commit: `chore: close sprint/<slug> [THINK]`.

## Constraints
- **Atomic commits:** Referencing TASK-ID.
- **Exception:** idea-draft registration uses the `idea:` commit prefix.
- **Commit prefix:** Mandatory selection from `docs/guidelines/core.md`.

## Action Safety Boundaries (CI)
| Action | Execution | Gate |
|--------|-----------|------|
| `action:test` | Automatic | None |
| `action:lint` | Automatic | None |
| `action:build` | Automatic | None |
| `action:deploy` | Manual | Human Approval |
| `action:pr-create` | Manual | Human Approval |

These boundaries define which tools can be invoked autonomously in CI environments.
