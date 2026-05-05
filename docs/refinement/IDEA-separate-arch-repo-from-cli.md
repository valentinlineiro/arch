# IDEA: separate-arch-repo-from-cli
**Created:** 2026-04-29
**Source:** human — `idea:` DO mode submission
**Status:** DRAFT
**Meta:** P1 | M | local | docs/, cli/

## Problem
The ARCH protocol (docs/, scripts/, config) and the CLI product (cli/) live in the same repository. This couples protocol evolution to CLI release cycles and makes it harder to adopt ARCH in projects that don't use the CLI, or to evolve the CLI independently from the protocol spec.

## Proposed solution
Split into three repositories:
1. **arch-protocol** — docs/, arch.config.json schema, AGENTS.md, guidelines. Published as `@arch/protocol` npm package. Source of truth for the protocol spec.
2. **arch-cli** — cli/ source, package.json, CI/CD for npm publish. Consumes `@arch/protocol` as a versioned dependency.
3. **arch-web** — Angular control panel and HTML tooling (arch-*.html). Blocked until the split is complete.

Existing ARCH instances upgrade the protocol via `npm update @arch/protocol`.

## Dependencies
- This split is a **prerequisite** for all Angular/arch-web tasks — they are blocked until repos are separated.
- TASK-089 (ARCH course) — documentation should be stable before splitting protocol repo.

## Estimated size
M

## Gaps
All resolved:
- **Scope:** Three repos — `arch-protocol`, `arch-cli`, `arch-web`.
- **Angular dependency:** All Angular tasks blocked until split is complete.
- **Protocol distribution:** `@arch/protocol` npm package; `arch-cli` consumes it as a versioned dependency.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
