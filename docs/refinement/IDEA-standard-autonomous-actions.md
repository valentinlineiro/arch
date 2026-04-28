# IDEA: Standard actions for autonomous development lifecycle
**Created:** 2026-04-27
**Source:** Human request — move agent from writing code to managing releases
**Status:** DRAFT
**Meta:** P2 | M | human | .github/workflows/, docs/agents/

## Problem
The agent can write and commit code but has no standard, named actions for the full lifecycle (test, lint, build, deploy, PR creation). Each project wires these up ad-hoc, if at all. There is no reusable contract between the agent and CI.

## Proposed solution
Define a set of standard action contracts (`action:test`, `action:lint`, `action:build`, `action:deploy`, `action:pr-create`) as reusable GitHub Actions workflows. The agent invokes them by name; CI executes and reports pass/fail back as a status check.

## Dependencies
- TASK-088 (autonomous loop) — the feedback loop from CI back to the agent is defined there.

## Estimated size
M

## Gaps
- TASK-055 (Selective Approval matrix) referenced in original — verify it's still in archive and whether its decisions are still valid.
- Safety boundary matrix (which actions auto-execute vs. require human gate) is not yet defined.
- "Feedback loop" (agent reads CI output to decide next step) overlaps with TASK-088; needs deduplication before promotion.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
