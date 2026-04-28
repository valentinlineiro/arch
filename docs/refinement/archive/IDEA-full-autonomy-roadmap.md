# IDEA: Roadmap to Full Autonomy
**Created:** 2026-04-27
**Source:** Human request via THINK mode
**Status:** DECIDED

## Proposal
Assess the current state of ARCH and define the structural, technical, and protocol gaps preventing the system from operating with 100% autonomy (zero human intervention). This includes autonomous task creation, execution, validation, and self-archiving.

## Gaps
- **Level 1 (Current):** Agent implements human-defined tasks. Human approves every commit and promotion.
- **Level 2 (In Sight):** Agent proposes and promotes `XS` tasks (IDEAs) autonomously. Human still approves PRs.
- **Level 3:** Agent approves its own PRs if 100% of deterministic tests and `arch review` pass.
- **Level 4 (Full Autonomy):** System self-heals. Agent detects drift, creates bug task, fixes it, and archives it without human notification until completion.

## Decision
Establish the Autonomy Levels framework in a new guideline. Pilot Level 2 by allowing autonomous promotion of XS tasks categorized as Operations or Documentation.
PROMOTE → TASK-055
