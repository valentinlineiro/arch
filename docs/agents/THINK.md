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
   - **DRAFT:** Identify gaps, dependencies, and estimate. Output to terminal only. Increment `**Sessions:** N` counter in the IDEA file (add field if missing). If `Sessions >= 3`, emit `[STALE-IDEA] IDEA-slug — N sessions without Decision` to stdout. If the IDEA was already flagged `[STALE-IDEA]` in the previous session (Sessions > 3) and still has no Decision, move it to `docs/refinement/archive/` with status `REJECTED: TTL expired`.
   - **DECIDED:** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA.
   - **REJECTED:** Move to `docs/refinement/archive/`.

## Phase 3: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 3 — Continuous Kaizen` to stdout.
1. **Kaizen Learning:** Run `arch review --json`. If failures exist (and aren't in `docs/KAIZEN-LOG.md` exceptions), analyze violations/drift against `docs/PRINCIPLES.md` (primary context) and `docs/KAIZEN-LOG.md` (audit trail). If a violation matches an existing principle, reference it. If it represents a new pattern, propose a new principle entry and a hardening task (`fix:` or `feat:`) to prevent recurrence.
2. **Mura Detection:** Read `Turns: N` from the last 10 archived tasks. For each size tier (XS/S/M/L), compute the average. If actual avg exceeds the expected range in `docs/METRICS.md` by >50%, emit `[MURA] <size>-tier avg=N turns (threshold=T)` to stdout and propose a re-estimation or decomposition task.
3. **Immediate Improvements:** Identify context gaps or guideline changes based on patterns.
4. **Sprint Metrics:** On sprint close, generate `docs/METRICS.md` summary using the Sprint Template block.
5. **Periodic Architecture Revision (bi-weekly):** Every two weeks, regardless of active tasks, run a focused architecture audit. Use `docs/METRICS.md` cost-per-task and turns-per-task data as the primary signal for identifying friction candidates. Produce a numbered list of concrete streamlining proposals — each must be an actionable proposal, not an observation — formatted as:
   ```
   [REVISION] <N>. <proposal> → <next action: IDEA draft IDEA-slug | direct fix in <file>>
   ```
   Output to terminal only. If a proposal warrants a task, create an IDEA draft in `docs/refinement/` and commit with `idea:` prefix.

## Output
- Ephemeral read-only output to terminal.
- Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
- **Finally, print:** `[THINK] Done` to stdout.
