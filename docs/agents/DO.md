# DO.md
<!-- ARCH v0.6.0 — Modular Execution -->
<!-- Purpose: Execute tasks from docs/tasks/ or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git fetch` (sync state safely without merging).
2. Find highest priority `READY` task in `docs/tasks/`.
   - **Automated Selection:** Run `arch next` to identify the deterministic candidate.
3. Set status to `IN_PROGRESS`, add lock in Meta line, and commit immediately.
4. Implement against Acceptance Criteria ONLY.
5. On completion:
   - **Handover:** The agent that implements a task CANNOT archive it. It must yield to an Auditor.
   - **Review Request:** Append a `REVIEW_REQUEST` entry to `docs/INBOX.md` with Task ID, AC list, and changed files.
   - Status to `REVIEW`, release lock, and stop.
6. **Auditor Step:**
   - A fresh session reads `docs/INBOX.md`.
   - Run `arch review` and verify each AC against actual repository state.
   - If pass: Append `REVIEW_PASS` to `docs/INBOX.md`, set status to `DONE`.
   - If fail: Append `REVIEW_FAIL` to `docs/INBOX.md` with evidence, set status back to `READY` (Focus:no).
   - Only an Auditor can move a task to `docs/archive/`.

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

## Andon Cord (Halt Conditions)
The autonomous execution loop must halt and yield to a human when any of these conditions are met:

1. **Review Failure Loop:** If `arch review` fails 3 consecutive times on the same task.
2. **Budget Exceeded:** If the task turn count exceeds the Muri threshold for its size (see `arch.config.json`).
3. **Major Change / Protected Path:** If implementation requires touching a `protectedPath` or triggers a MAJOR architectural change without a prior ADR.

**Stop Behavior:**
1. Halt all execution.
2. Append an `ANDON_HALT` entry to `docs/INBOX.md` with the condition met and supporting evidence (e.g., violation logs or turn counts).
3. Exit the session.
4. Resume ONLY upon human `APPROVE` or `REDIRECT` in INBOX.

These boundaries define which tools can be invoked autonomously in CI environments.
