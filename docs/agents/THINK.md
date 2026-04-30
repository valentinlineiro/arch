# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->
<!-- Purpose: Assess system health, refine ideas, and propose real-time improvements -->

## Phase 1: Governance & Replenishment (Conductor)
0. **Print:** `[THINK] Phase 1 — Governance & Replenishment` to stdout.
1. **Run:** `arch govern`.
   - Archival Guard, Flow Guard, and Replenishment are handled deterministically by the CLI.
   - If `arch govern` reports a condition requiring AI judgment (e.g., all READY tasks are blocked), proceed to Phase 2. Otherwise, Phase 1 is complete.
2. **Health Evaluation:** If running in an interactive session, manually verify system health signals that the CLI may not yet detect:
   - **Priority Escalation:** Identify P0 tasks that are blocked or not focused.
   - **Stale Locks:** If a task is `IN_PROGRESS` with a lock > 3 days, create a P1 `READY` bug task in `docs/tasks/` citing the stale task ID and lock age.
3. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 has stale lock' or CLI output from `arch govern`).

## Phase 2: Idea Refinement (Refine)
0. **Print:** `[THINK] Phase 2 — Idea Refinement` to stdout.
1. Scan `docs/refinement/` for all `IDEA-*.md` files. **Triage:** process all IDEAs that have a `Decision:` field first; for DRAFT IDEAs (no `Decision:`), process at most 3 per session ordered by file creation date (oldest first) — skip the rest and print `[THINK] Skipped N DRAFT IDEAs (cap reached)`.
2. For each IDEA, apply lifecycle rules:
   - **DRAFT:** Identify gaps, dependencies, and estimate. Output to terminal only.
   - **DECIDED + no task exists:** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA.
   - **REJECTED:** Move to `docs/refinement/archive/`.

## Phase 3: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 3 — Continuous Kaizen` to stdout.
1. **Simplification:** Count protocol phases (target <= 5), Meta fields (target <= 7), and guideline sections (target <= 8). If exceeded, propose a reduction task using `[KAIZEN]` format.
2. **Kaizen Learning (Mistake Analysis):**
   - Run `arch review --json`.
   - If failures exist:
     - Analyze `violations` and `drift`.
     - **Override:** Check `docs/KAIZEN-LOG.md` section `## Exceptions`. If the violation string (or a substring) is listed, skip.
     - For non-excepted mistakes, record the pattern in `docs/KAIZEN-LOG.md` (e.g., "Recurring drift in X") and propose a hardening task (`fix:` or `feat:`) or a guideline refinement to prevent recurrence.
3. **Immediate Improvements:** Identify context gaps, propose guideline changes based on patterns, and provide qualitative context to `arch review` failures.
4. **Sprint Metrics:** On sprint close (triggered via DO Operations), generate `docs/METRICS.md` summary (tasks, cycle time, size accuracy, AI/human ratio).
5. **Logic Absorption:** This phase replaces the former `RETRO.md` protocol.

## Output
- Ephemeral read-only output to terminal.
- Format: `[CLI] [mode] TASK-ID — reason: [reason] \n   Evidence: [evidence]`
- For Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- For Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
- **Finally, print:** `[THINK] Done` to stdout.
