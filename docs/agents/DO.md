# DO.md
<!-- ARCH v0.6.0 — Modular Execution -->
<!-- Purpose: Execute tasks from docs/tasks/ or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git fetch` (sync state safely without merging).
2. **Conflict Resolution:** If `git pull --rebase` (or equivalent loop sync) encounters a conflict:
   - Run `arch merge-resolve`.
   - **Auto-merge:** Permitted ONLY for pure-append conflicts on `docs/INBOX.md` and `**Meta:**` status-line-only changes in `docs/tasks/*.md`. All other conflicts MUST escalate.
   - **Protected Paths:** Auto-merge NEVER touches `docs/adr/`, `arch.config.json`, or `cli/src/main/ts/domain/` (always escalate).
   - **Escalation:** If auto-merge fails or is not permitted, append a timestamped `MERGE_ESCALATE` entry to `docs/INBOX.md` and halt.
3. Find highest priority `READY` task in `docs/tasks/`.
   - **Automated Selection:** Run `arch next` to identify the deterministic candidate.
4. **Sentinel Pre-flight:** Verify task ACs and description against `negativeConstraints` in `arch.config.json` using an XS reasoning call.
   - **Escalation:** If a potential violation is identified, append a timestamped `AWAITING_APPROVAL | SENTINEL_VIOLATION` entry to `docs/INBOX.md` with evidence and halt.
5. Set status to `IN_PROGRESS`, add lock in Meta line, and commit immediately.
6. Implement against Acceptance Criteria ONLY.
7. On completion:
   - **Hansei Check:** Before setting status, check if any trigger applies: (a) actual size differed from estimate, (b) a blocker was encountered, (c) task is `M` or larger. If any trigger applies, the Hansei should reflect that signal directly. For any task that will be archived as `DONE` from `TASK-195` onward, always append a `## Hansei` section (1–3 sentences), even on XS/S happy-path work, because the close transition enforces its presence.
   - **Predicate Check:** Run `arch task review TASK-XXX` to execute all `cmd:` predicates and atomically set status to REVIEW. If any predicate fails, fix the implementation before retrying — do not manually override the status. If the task has no `cmd:` predicates, set status to REVIEW manually and proceed.
   - **Handover:** The agent that implements a task CANNOT archive it. It must yield to an Auditor.
   - **Review Request:** Append a `REVIEW_REQUEST` entry to `docs/INBOX.md` with Task ID, AC list, and changed files.
   - Release lock and stop.
   - **Telemetry:** Finally, print `Turns: [count]` and `Cost: $[amount]` to stdout for loop tracking.
7. **Auditor Step:**
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
2. **Sprint Open:**
   - **Trigger:** Human declares new sprint with slug.
   - **Set:** Update `"currentSprint": "<slug>"` in `arch.config.json`.
   - **Assign:** Add `**Sprint:** <slug>` to the Meta line of designated tasks.
   - **Commit:** `chore: open sprint/<slug> [THINK]`.
3. **Sprint Close:**
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
3. **EXEC Timeout:** If the `EXEC` phase exceeds the configured timeout (default: 10 minutes) without returning. Configurable via `governance.execTimeoutMinutes` in `arch.config.json`.
4. **Major Change / Protected Path:** If implementation requires touching a `protectedPath` or triggers a MAJOR architectural change without a prior ADR.

**Stop Behavior:**
1. Halt all execution.
2. Append a timestamped `ANDON_HALT` entry to `docs/INBOX.md` with the condition met and supporting evidence (e.g., violation logs or turn counts).
   - **Format:** `## [YYYY-MM-DD HH:MM] ANDON_HALT | [Task-ID] | [Condition]`
3. Exit the session.
4. Resume ONLY upon human `APPROVE` or `REDIRECT` in INBOX.

## Human-Approval Protocol
Any action hitting a human-approval gate (e.g., `action:deploy`, `action:pr-create`, or architectural changes) must append a timestamped entry to `docs/INBOX.md` before halting.
- **Format:** `## [YYYY-MM-DD HH:MM] AWAITING_APPROVAL | [Type] | [Description]`
- **Examples:**
  - `## [2026-04-30 14:00] AWAITING_APPROVAL | DEPLOY | Deploy v0.6.0 to production`
  - `## [2026-04-30 14:05] AWAITING_APPROVAL | MAJOR_CHANGE | Update core auth logic`

These boundaries define which tools can be invoked autonomously in CI environments.
