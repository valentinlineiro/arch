# THINK.md
<!-- ARCH v0.3 — Modular Thinking -->
<!-- Purpose: Assess system health, identify attention points, and refine new ideas -->

## Phase 1: System Check (Conductor)
1. Scan `docs/tasks/sprint/` for all active tasks.
2. Read recent tasks in `docs/archive/` (Last 5 by modification time).
3. Evaluate health:
   - Stale locks (Task IN_PROGRESS for >3 days without commit).
   - Priority escalation (P0 tasks blocked or not started).
   - Sprint risks (Dependencies not met).
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 in sprint/ has stale lock').

## Phase 2: Idea Refinement (Refine)
1. Scan `docs/tasks/backlog/` for tasks with `IDEA` status.
2. If IDEAs exist: Identify gaps, dependencies, and kaizen suggestions.
3. If no IDEAs exist: Skip this phase.

## Output
- Ephemeral output to terminal.
- Format: `[CLI] [mode] TASK-ID — reason: [reason] \n   Evidence: [evidence]`
