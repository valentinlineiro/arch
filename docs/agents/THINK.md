# THINK.md
<!-- ARCH v0.4 — Modular Thinking & Continuous Kaizen -->
<!-- Purpose: Assess system health, refine ideas, and propose real-time improvements -->

## Phase 1: System Check (Conductor)
1. Scan `docs/tasks/` for all active tasks (Focus:yes = active, Focus:no = queued).
2. Read recent tasks in `docs/archive/` (Last 5 by modification time).
3. Evaluate health:
   - Stale locks (Task IN_PROGRESS for >3 days without commit).
   - Priority escalation (P0 tasks blocked or not started).
   - Focus drift (Focus:no tasks at P0 that should be Focus:yes).
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 in sprint/ has stale lock').

## Phase 2: Idea Refinement (Refine)
1. Scan `docs/refinement/` for all `IDEA-*.md` files.
2. If no files exist: Skip this phase.
3. For each IDEA, apply lifecycle rules based on status:
   - **DRAFT:** Identify gaps, missing dependencies, and sizing estimate. Output to terminal only — do not modify the draft file.
   - **DECIDED + no task exists yet:** If gaps are filled, promote to a new task in `docs/tasks/`. If gaps remain, report them. **Promotion is an atomic operation:** Update the IDEA status to `PROMOTED -> TASK-XXX`, create the task file, and commit both immediately.
   - **DECIDED + task already exists:** Leave the IDEA file untouched — it is a permanent historical record.
4. **Never delete IDEA files.** DECIDED IDEAs remain in `docs/refinement/` as an audit trail of how decisions were reached.

## Phase 3: Continuous Kaizen (Real-time Reviewer)
1. **Immediate Gap Closing:** During system check, identify missing context or logic gaps in the current task or sprint.
2. **Real-time Guideline Proposal:** Detect patterns in `docs/archive/` or git history. If a pattern suggests a systematic improvement, propose a guideline change in `docs/guidelines/` immediately.
3. **Integration with 'arch review':** Provide qualitative context to deterministic failures reported by the CLI.
4. **Logic Absorption:** This phase replaces the former `RETRO.md` protocol, making sprint retrospectives a continuous activity rather than a batch process.
5. **Sprint metrics (on sprint close):** Generate `docs/METRICS.md` covering: tasks closed, avg cycle time (git log date → `Closed-at`), size accuracy, AI/human ratio, regressions detected, framework improvements applied.

## Phase 4: Autonomous Replenishment (Backlog Health)
1. **Trigger:** If the count of `READY` tasks (Focus:yes/no) is less than 3, this phase is mandatory.
2. **Analysis Scope:** Scan the last 10 tasks in `docs/archive/` and the last 3 entries in `docs/KAIZEN-LOG.md`.
3. **Action:** Propose at least one new `IDEA-*.md` in `docs/refinement/` addressing either:
   - **Drift Prevention:** New checks for `arch review`.
   - **Protocol Hardening:** Automating manual protocol steps.
   - **Context Pruning:** Removing stale/redundant files or logic.

## Output
- Ephemeral output to terminal.
- Format: `[CLI] [mode] TASK-ID — reason: [reason] \n   Evidence: [evidence]`
- For Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- For Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
