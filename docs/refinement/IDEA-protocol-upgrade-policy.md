# IDEA: protocol-upgrade-policy
**Created:** 2026-05-18
**Source:** Human question about how governed repos should handle ARCH upgrades over time
**Status:** DRAFT
**Meta:** P2 | S | claude | docs/guidelines/, CHANGELOG.md, docs/AGENTS.md, cli/package.json
<!-- cli: local | claude | gemini | human -->

## Problem
When a repository is governed by ARCH and ARCH itself upgrades, the governed repo's operating model changes with it. Without an explicit adoption protocol, upgrades can create hidden governance drift:

- the CLI enforces rules the repo has not adopted
- docs describe rules the current CLI no longer implements
- new warning or failure modes appear without migration work
- humans lose track of whether the repo is pinned, migrating, or intentionally behind

ARCH currently documents semver categories and deprecation behavior, but it does not yet define how a governed repo should evaluate, adopt, defer, or reject a new ARCH version.

## Proposed solution
Define an explicit protocol upgrade policy for governed repos:

1. classify upgrades as patch / minor / major
2. require an evaluation task before adoption
3. require explicit adoption / defer / reject outcome
4. require post-upgrade validation (`arch review` + workflow smoke test)
5. define compatibility expectations for deprecations, aliases, and migration guides

The immediate output is a planning policy doc. If accepted, it can later be promoted into a canonical guideline or ADR.

## Dependencies
none

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- REJECT: <one-line rationale>                    — no THINK evaluation required. Write it now. -->
<!-- PROMOTE → TASK-XXX                              — commits to execution. THINK evaluation expected. -->
<!-- EXTEND: <specific gap or dependency> until <event that triggers re-evaluation> — costs more than REJECT. -->
<!--                                                                                                         -->
<!-- Attribution (optional, tracked for influence measurement):                                              -->
<!--   [influenced-by: THINK-abc123]  REFLECT influenced this decision                                       -->
<!--   [influenced-by: none]          REFLECT did not influence (explicitly declared)                        -->
<!--   (no annotation)                undeclared — not the same as "independent"                             -->
