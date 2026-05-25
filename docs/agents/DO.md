# DO.md
<!-- ARCH v1.2.0 — Modular Execution -->
<!-- Purpose: Execute tasks from docs/tasks/ or perform human-directed operations -->

## Intent: Execute Task (Exec)
1. `git fetch` (sync state safely without merging).
2. **Conflict Resolution:** If `git pull --rebase` (or equivalent loop sync) encounters a conflict:
   - Run `arch merge-resolve`.
   - **Auto-merge:** Permitted ONLY for pure-append conflicts on `docs/INBOX.md` and `**Meta:**` status-line-only changes in `docs/tasks/*.md`. All other conflicts MUST escalate.
   - **Protected Paths:** Auto-merge NEVER touches `docs/adr/`, `arch.config.json`, or `cli/src/main/ts/domain/` (always escalate).
   - **Escalation:** If auto-merge fails or is not permitted, append a timestamped `MERGE_ESCALATE` entry to `docs/INBOX.md` and halt.
   - **Merge resolve:** Run `arch task merge-resolve` (legacy: `arch merge-resolve`).
3. Find highest priority `READY` task in `docs/tasks/`.
   - **Automated Selection:** Run `arch task next` to identify the deterministic candidate.
4. **Sentinel Pre-flight:** Verify task ACs and description against `negativeConstraints` in `arch.config.json` using an XS reasoning call.
   - **Escalation:** If a potential violation is identified, append a timestamped `AWAITING_APPROVAL | SENTINEL_VIOLATION` entry to `docs/INBOX.md` with evidence and halt.
5. Set status to `IN_PROGRESS` and commit immediately. Session lock state (`lockedBy`, `lockedAt`) is in-memory only — never written to the file. `Locked-commit` is written as an auxiliary provenance field below the Meta line (not in the meta line itself) by `arch task in-progress`.
6. Implement against Acceptance Criteria ONLY.
7. On completion:
   - **Hansei Check:** Before setting status, check if any trigger applies: (a) actual size differed from estimate, (b) a blocker was encountered, (c) task is `M` or larger. If any trigger applies, the Hansei should reflect that signal directly. For XS/S happy-path work with no trigger, Hansei is optional — triggered-only for XS/S, always required for M/L/XL.
   - **Predicate Check:** Run `arch task review TASK-XXX` to execute all `cmd:` predicates and atomically set status to REVIEW. If any predicate fails, fix the implementation before retrying — do not manually override the status. If the task has no `cmd:` predicates, set status to REVIEW manually and proceed.
   - **Handover:** The agent that implements a task CANNOT archive it by default. It must yield to an Auditor.
     - **Exception (Auditor Bypass — L3):** XS/S tasks where `DeterministicACVerifier` returns `pass: true` with at least one `cmd:` or `file:` AC qualify for L3 self-archive. When the L3 gate passes: `arch task done TASK-XXX` archives the task automatically, writes `[AWAITING_REVIEW] TASK-XXX [L3-AUTO]` to `docs/INBOX.md` with full evidence table, and commits with `done: [TASK-XXX] <title> [L3-AUTO]`. Pure-prose tasks (all ACs are `prose:`/`code:`) do NOT qualify — they require a human Auditor.
     - **Gate conditions:** (1) size XS or S, (2) verifier `pass: true`, (3) evidence contains ≥1 `cmd:` or `file:` AC.
     - See ADR-009 for full rationale and rollback procedure.
   - **Review Request:** If the Auditor bypass does not apply, append a `REVIEW_REQUEST` entry to `docs/INBOX.md` with Task ID, AC list, and changed files.
   - Release lock and stop.
   - **Telemetry:** Finally, print `Turns: [count]` and `Cost: $[amount]` to stdout for loop tracking.
7. **Auditor Step (human-supervised — not an automated loop):**
   - The human reads `docs/INBOX.md` for `REVIEW_REQUEST` entries, then starts a fresh Auditor session.
   - Run `arch check` and verify each AC against actual repository state.
   - If pass: Append `REVIEW_PASS` to `docs/INBOX.md`, set status to `DONE`.
   - If fail: Append `REVIEW_FAIL` to `docs/INBOX.md` with evidence, set status back to `READY` (Focus:no).
   - Only an Auditor can move a task to `docs/archive/`.
   - **Note:** INBOX is human-read, agent-write. The automated loop never reads INBOX for control signals — it uses `.arch/escalations.jsonl` as the structured state source.

## Intent: Operations (Ops)
1. **Manual Task/Idea Management:**
   - Interpret intent (Mark DONE, Start task, Block, Add idea).
   - **New Task Guard:** Search title keywords before creation. If match found, halt for confirmation.
   - **Idea Drafts:** If input starts with `idea:`, create `docs/refinement/IDEA-[slug].md` and commit immediately with `idea: add draft [slug]`.
   - **Archive/Move:** Move files between `tasks/` and `archive/`. Update `Focus:yes/no`. Commit once per op.
   - **Marking DONE:** Add `Closed-at` timestamp.
   - **IDEA Decision (PROMOTE or REJECT):** When a human writes `PROMOTE → TASK-XXX` or `REJECT` in an IDEA's Decision field, the executing agent MUST append a RESOLVED record to `.arch/escalations.jsonl`: `{ escalation_id: "RESOLVED-<idea-slug>-<timestamp>", timestamp, type: "AWAITING_PROMOTION", subject: "<idea-slug>", status: "RESOLVED", reason: "<decision summary>", resolved_at: <ISO 8601>, resolved_by: "<session-id>" }`. This closes the open AWAITING_PROMOTION escalation entry and prevents `StaleEscalations` drift warnings.
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

## L3 Sprint Autonomy (`arch task loop --sprint`)

`arch task loop --sprint <slug>` runs the autonomous loop scoped to a single sprint. Only tasks tagged `**Sprint:** sprint/<slug>` are eligible; all other tasks are ignored regardless of priority.

**Sprint-level governance gates:**
- **Sprint Andon:** If more than 2 consecutive tasks hit Andon Cord conditions, the loop writes an `ANDON_HALT` entry to `docs/INBOX.md` and halts. The counter resets on each successful task completion.
- **Sprint Checkpoint:** When 50% of sprint tasks are archived, the loop writes a `SPRINT_CHECKPOINT` entry to `docs/INBOX.md` and pauses. Resume with `arch task loop --sprint <slug> --resume` after async human review.

**L3 eligibility** (see `docs/guidelines/autonomy.md`): `6-writing` and `7-operations` tasks are L3-eligible by default. `2-code-generation` tasks require an explicit `L3:yes` annotation in the sprint definition.

## Andon Cord (Halt Conditions)
The autonomous execution loop must halt and yield to a human when any of these conditions are met:

1. **Review Failure Loop:** If `arch check` fails 3 consecutive times on the same task.
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
  - `## [2026-04-30 14:00] AWAITING_APPROVAL | DEPLOY | Deploy v1.2.0 to production`
  - `## [2026-04-30 14:05] AWAITING_APPROVAL | MAJOR_CHANGE | Update core auth logic`

These boundaries define which tools can be invoked autonomously in CI environments.

### Size-tiered closure path

| Size | Close command | Hansei | REVIEW stage |
|------|--------------|--------|--------------|
| XS   | `arch task done TASK-XXX` | Not required | Skipped — direct to DONE when `arch check` passes |
| S    | `arch task done TASK-XXX` | Optional | Required only if present in task |
| M    | `arch task done TASK-XXX` | Required — wizard runs | Required |
| L    | `arch task done TASK-XXX` | Required — wizard runs | Required + Auditor |

XS is the explicit exception to the default Auditor invariant. Direct-to-DONE is intentional.
