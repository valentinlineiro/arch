# IDEA: Standard actions to allow autonomous development
**Created:** 2026-04-27
**Source:** Human request via DO mode
**Status:** DRAFT

## Proposal
Define and implement a set of "Standard Actions" (either via GitHub Actions or internal agent protocols) that allow the agent to perform the complete development lifecycle autonomously. This moves the agent from "writing code" to "managing releases".

## Gaps
- **Lifecycle Mapping:** Define what "Standard" means:
  - `action:test`: Run the full test suite and report results.
  - `action:lint`: Check and fix style violations.
  - `action:build`: Verify the project compiles/builds.
  - `action:deploy`: Push to staging/production (e.g., GitHub Pages).
  - `action:pr-create`: Automate the creation of PRs from the current branch.
- **Safety Boundaries:** Which actions require human confirmation (e.g., `deploy` to production) and which are background tasks (e.g., `lint`).
- **Feedback Loop:** How does the agent "read" the output of a GitHub Action to decide if the next step is safe?
- **Integration:** How these actions interact with the `Selective Approval` matrix (TASK-055).

## Decision
[TBD]
