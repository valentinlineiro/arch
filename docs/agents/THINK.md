# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->

## Phase 1: Context & Replenishment (Conductor)
0. **Print:** `[THINK] Phase 1 — Context & Replenishment` to stdout.
1. **Note:** `arch govern` was already executed by the CLI to trigger this session.
2. **Health Evaluation:** Identify P0 tasks that are blocked or not focused. If a task is `IN_PROGRESS` with a lock > 3 days, create a P1 `READY` bug task in `docs/tasks/`.
3. **INBOX Regeneration:** Overwrite `docs/INBOX.md` with current loop status, active/READY task counts, pending items (`AWAITING_PROMOTION`, `AWAITING_REVIEW`), and summaries of the last 5 completed tasks. Commit with `[THINK]` tag.
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 has stale lock').

## Phase 2: Idea Refinement (Refine)
0. **Print:** `[THINK] Phase 2 — Idea Refinement` to stdout.
1. Scan `docs/refinement/` for `IDEA-*.md` files. Triage: process all IDEAs with a `Decision:` field first; for DRAFT IDEAs, process at most 3 per session.
2. For each IDEA, apply lifecycle rules:
   - **DRAFT:** Identify gaps, dependencies, and estimate. Output to terminal only.
   - **DECIDED:** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA.
   - **REJECTED:** Move to `docs/refinement/archive/`.

## Phase 3: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 3 — Continuous Kaizen` to stdout.
1. **Kaizen Learning:** Run `arch review --json`. If failures exist (and aren't in `docs/KAIZEN-LOG.md` exceptions), analyze violations/drift. Record patterns and propose hardening tasks (`fix:` or `feat:`) to prevent recurrence.
2. **Immediate Improvements:** Identify context gaps or guideline changes based on patterns.
3. **Sprint Metrics:** On sprint close, generate `docs/METRICS.md` summary.

## Output
- Ephemeral read-only output to terminal.
- Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
- **Finally, print:** `[THINK] Done` to stdout.
