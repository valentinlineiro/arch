# IDEA: Productizing ARCH (Protocol, CLI, UI Separation)
**Created:** 2026-05-22T12:00:00Z
**Source:** User feedback during ARCH maturity assessment
**Status:** PROMOTED → TASK-992 (Phase A), TASK-993 (Phase B), TASK-994 (Phase C), TASK-995 (Phase D)
**Sessions:** 1
**Meta:** P1 | L | human | docs/tasks, docs/refinement, cli/src/main/ts

## Problem
ARCH is a powerful, deterministic framework, but it suffers from five major friction points that prevent it from being a commercial product:
1.  **High Ontology Load:** The system is "ceremony-heavy," requiring deep knowledge of the markdown schema.
2.  **Discipline Dependency:** The Causal Graph breaks if humans make minor Git or formatting errors.
3.  **Hardcoded Repo-Awareness:** The CLI assumes specific folder structures (`docs/tasks`), preventing easy adoption in existing codebases.
4.  **Decision Blindness:** At high AI execution velocity, human operators lose track of architectural drift.
5.  **CLI-Only Interface:** Non-technical stakeholders have no visibility into the system's "moat" or sprint progress.

## Proposed solution
To resolve these five friction points, we must decouple ARCH into three distinct layers: Protocol, CLI, and UI.

### Layer 1: The Protocol (Addressing Repo-Awareness & Discipline)
*   **Intent to Refinement Integration:** Redesign `arch capture` so it respects the `IDEA → DRAFT → THINK → PROMOTE` invariant. It translates natural language intent into a structured `IDEA-[slug].md` draft, pre-filled with dependencies and estimates, rather than jumping straight to a TASK.
*   **Dynamic Repository Schema:** Extract all hardcoded paths (e.g., `docs/tasks`) from the codebase. The Protocol must be fully defined by `arch.config.json`.
*   **Enforced Git Hooks:** Shift protocol enforcement from human discipline to Git via `commit-msg` (auto-appending Task IDs), `pre-commit` (running `arch check --scope delta`), and `pre-push` hooks.

### Layer 2: The CLI (Addressing Ontology Load & Decision Blindness)
*   **Interactive Onboarding:** Replace manual documentation reading with `arch init --guided` to generate the initial protocol configuration.
*   **Actionable Remediation & Auto-fix:** Refactor `arch check` outputs to provide the exact CLI command needed to fix issues. Include an `--auto-fix` flag for minor markdown formatting errors.
*   **Unified Interactive Approval Queue:** Introduce `arch review` to step the human through pending decisions (showing diffs and providing `[y/N/edit]` prompts).
*   **Velocity Throttles & Silent Mode:** Implement an "Andon Cord" that halts autonomous loops on high velocity. Allow silent archival of `XS/S` tasks to prevent notification fatigue.

### Layer 3: The UI (Addressing CLI-Only Interface)
*   **Read-Only Web Dashboard:** Evolve the prototype `arch-viewer.html` into `arch ui` that visualizes the current sprint status.
*   **Visualizing the Causal Graph:** Render the Causal Memory as an interactive node graph to explore architectural decisions.
*   **High-Level Impact Digests:** Enhance `arch analyze` to output high-level summaries of batch changes to the UI.

## Dependencies
none

## Estimated size
L

## Gaps
<!-- THINK evaluation — Session 1 -->

1. **Monolithic scope** — L-size bundles 5 independent problems into one architectural restructuring. Several are independently solvable without a unifying 3-layer separation (e.g., git hooks don't need a Protocol layer).
2. **No MVP defined** — `arch.config.json` path extraction alone (sub-item of Layer 1) addresses friction #3 and partially #2. No staged delivery path is identified.
3. **No backward compatibility** — existing repos with hardcoded `docs/tasks/` assumptions would break without a migration strategy.
4. **No success criteria** — "productized" lacks a measurable outcome. What specifically defines completion?
5. **Layer 3 (UI) is premature** — a web dashboard needs a stable Protocol API surface that doesn't exist yet. Building it before the API ossifies guarantees rework.
6. **No `arch.config.json` schema evolution plan** — making paths dynamic changes the config contract. Existing configs need migration.

**Suggested decomposition into independently promotable phases:**
- Phase A (S): Extract hardcoded paths to `arch.config.json` paths block
- Phase B (M): Git hooks (`commit-msg`, `pre-commit arch check --scope delta`)
- Phase C (M): Interactive CLI improvements (`init --guided`, `arch review`, `--auto-fix`)
- Phase D (M/L): Web dashboard (`arch ui`) — deferred until Protocol API surface stabilizes

## Decision
PROMOTE → TASK-992, TASK-993, TASK-994, TASK-995 — Decomposed into 4 phases per THINK evaluation (Session 1).
