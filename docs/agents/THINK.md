# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->
<!-- Purpose: Assess system health, refine ideas, and propose real-time improvements -->

## Phase 1: Governance & Replenishment (Conductor)
0. **Print:** `[THINK] Phase 1 — Governance & Replenishment` to stdout.
1. **System Check:**
   - Scan `docs/tasks/` for all active tasks (Focus:yes = active, Focus:no = queued).
   - **Archival Guard:** Scan `docs/tasks/` for any task with `Status: DONE`. Move to `docs/archive/` and commit: `chore: archive [TASK-ID] DONE [TASK-ID] [THINK]`.
   - Evaluate health: stale locks (>3 days), priority escalation (P0 blocked), and focus drift.
2. **Flow Guard:** If 0 tasks in `docs/tasks/` have `Focus:yes`, identify the `READY` task with the highest priority and smallest size (XS > S > M > L > XL) and autonomously set `Focus:yes`. Commit: `chore: autofocus [TASK-ID] via Flow Guard [TASK-ID] [THINK]`.
3. **Replenishment:** If the count of `READY` tasks is < 3, propose at least one new `IDEA-*.md` in `docs/refinement/` based on recent archive (last 10) and `KAIZEN-LOG.md`.
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 has stale lock').

## Phase 2: Idea Refinement (Refine)
0. **Print:** `[THINK] Phase 2 — Idea Refinement` to stdout.
1. Scan `docs/refinement/` for all `IDEA-*.md` files.
2. For each IDEA, apply lifecycle rules:
   - **DRAFT:** Identify gaps, dependencies, and estimate. Output to terminal only.
   - **DECIDED + no task exists:** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA.
   - **REJECTED:** Move to `docs/refinement/archive/`.

## Phase 3: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 3 — Continuous Kaizen` to stdout.
1. **Simplification:** Count protocol phases (target <= 5), Meta fields (target <= 7), and guideline sections (target <= 8). If exceeded, propose a reduction task using `[KAIZEN]` format.
2. **Immediate Improvements:** Identify context gaps, propose guideline changes based on patterns, and provide qualitative context to `arch review` failures.
3. **Sprint Metrics:** On sprint close (triggered via DO Operations), generate `docs/METRICS.md` summary (tasks, cycle time, size accuracy, AI/human ratio).
4. **Logic Absorption:** This phase replaces the former `RETRO.md` protocol.

## Output
- Ephemeral read-only output to terminal.
- Format: `[CLI] [mode] TASK-ID — reason: [reason] \n   Evidence: [evidence]`
- For Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- For Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
- **Finally, print:** `[THINK] Done` to stdout.
