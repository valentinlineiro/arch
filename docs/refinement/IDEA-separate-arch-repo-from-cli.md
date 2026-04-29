# IDEA: separate-arch-repo-from-cli
**Created:** 2026-04-29
**Source:** human — `idea:` DO mode submission
**Status:** DRAFT
**Meta:** P1 | M | local | docs/, cli/

## Problem
The ARCH protocol (docs/, scripts/, config) and the CLI product (cli/) live in the same repository. This couples protocol evolution to CLI release cycles and makes it harder to adopt ARCH in projects that don't use the CLI, or to evolve the CLI independently from the protocol spec.

## Proposed solution
Split into two repositories:
1. **arch-protocol** — docs/, scripts/arch.sh, arch.config.json schema, AGENTS.md, guidelines. The source of truth for the protocol itself.
2. **arch-cli** (or kept as `arch`) — cli/ source, package.json, CI/CD for npm publish. Consumes the protocol as a versioned reference.
Possibly a third repo for web tooling (docs/arch-*.html, Angular control panel).

## Dependencies
- TASK-097 (Angular control panel scaffold) — web tooling split depends on this being defined
- TASK-089 (ARCH course) — documentation should be stable before splitting protocol repo

## Estimated size
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
