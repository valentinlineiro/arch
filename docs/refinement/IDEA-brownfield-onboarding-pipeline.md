# IDEA: brownfield-onboarding-pipeline
**Created:** 2026-05-22
**Source:** ARCH comprehensive review — audit feature produces data nobody consumes; needs a pipeline to deliver value
**Status:** DRAFT
**Meta:** P1 | M | local | cli/src/main/ts/application/commands/audit-command.ts

## Problem

`arch audit` can scan any repo and produce a structural map (entities, edges, subsystems, risks). But the output goes nowhere — written to `.arch/deployment-map-v1.1.json` and never read by any command. This means:

- **Brownfield repos have no onboarding path.** A team with 50k lines of existing code can't adopt ARCH incrementally. `arch init` creates an empty protocol scaffold; it doesn't discover what already exists.
- **ARCH's only moat is unused.** The one thing ARCH can do that Linear/Jira/GitHub Projects cannot is read the actual code. The audit is the mechanism for that — but without a pipeline, it's a sensor with no actuator.
- **Onboarding is manual.** Currently adopting ARCH in a brownfield repo means: create tasks by hand for every module, guess dependencies, guess priorities. The audit could automate 80% of that.

## Proposed solution

**Phase 1 — `arch init --brownfield`**

Extend `arch init` with a `--brownfield` flag that:
1. Runs `arch audit` on the target repo
2. Generates an `ARCH.md` with the detected module structure
3. Creates initial ADRs documenting the existing architecture (one per detected subsystem)
4. Creates 3-5 debt tasks from detected structural risks (e.g., cyclic dependencies, untested modules)
5. Seeds `.arch/deployment-map-v1.1.json` as the initial context index
6. Runs `arch review` to verify the install is clean

The output is a governed repo in under 2 minutes, with the audit as the source of truth for the initial state.

**Phase 2 — `arch govern --seed`**

Use the deployment map to inform governance decisions:
- Task dependency suggestions based on actual module coupling (not manual `**Depends:**`)
- Priority suggestions: modules with high cyclomatic complexity or low test coverage get higher priority
- Context injection: when working on task X, the deployment map tells the agent which files are structurally related

**Phase 3 — Incremental enrichment**

Every `arch task done` updates the deployment map with new entities discovered during implementation. The map becomes a living structural index, not a one-time snapshot.

## Dependencies
- `arch audit` output format needs to be stable and consumable (currently v1.1 exists but has no consumers)
- `arch init` needs to accept `--brownfield` flag and post-audit hooks

## Estimated size
M — Phase 1 is ~1 week of focused work. Phases 2-3 are separate tasks.

## Gaps
- Audit adapters are regex-based and shallow. For `arch init --brownfield` to be trustworthy, the entity detection needs to be good enough that the initial ADRs aren't misleading. A wrong ADR is worse than no ADR.
- The deployment map format (ARCHDeploymentMap, UEGGraph) was designed for v1.1 analysis — may need schema adjustments to serve as a governance index.
- What happens when `arch audit` on a large monorepo produces 10k+ entities? The pipeline needs a compression or summary layer.

## Decision
