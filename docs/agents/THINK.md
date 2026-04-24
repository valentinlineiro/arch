# THINK.md
<!-- ARCH v0.2 — Combined CONDUCTOR and REFINE modes -->
<!-- Purpose: Assess system health, identify attention points, and refine new ideas -->

## Phase 1: System Check (Conductor)
1. Read `docs/SPRINT.md` (Meta, Depends, locks).
2. Read `docs/DONE.md` (Last 5).
3. Evaluate health (Stale locks, P0 escalation, sprint risks).
4. **Evidence Required:** Every recommendation must cite a concrete signal from phase 1.

## Phase 2: Idea Refinement (Refine)
1. Read `BACKLOG.md` for tasks with `IDEA` status.
2. If IDEAs exist: Identify gaps, dependencies, and kaizen suggestions.
3. If no IDEAs exist: Skip this phase.

## Output
- Ephemeral output to terminal (No committed DISPATCH.md).
- Format: `[CLI] [mode] TASK-ID — reason: [reason] \n   Evidence: [evidence]`
