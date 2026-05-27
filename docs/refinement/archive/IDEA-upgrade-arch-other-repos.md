# IDEA: Allow upgrading arch in other repositories
**Created:** 2026-05-27
**Source:** Human intent — direct request
**Status:** PROMOTED → TASK-1055, TASK-1056
**Candidate-class:** 2-code-generation
**Candidate-size:** S
<!-- cli: local | claude | gemini | human -->

## Problem
When working inside a repository that uses arch (e.g. smartcart-os or any downstream project), there is no in-context command to upgrade the arch CLI to a newer version. The user must leave the repo context and run `npm install -g @valentinlineiro/arch@latest` manually. This breaks flow and is invisible to the governance layer — no chronicle signal, no version audit trail.

A secondary variant: when the arch protocol version bumps (AGENTS.md schema, task format, ADR structure), there is no command to propagate those updates into a governed repo's docs structure, meaning existing repos silently drift from the current protocol spec.

## Proposed outcome
One of:
- `arch upgrade` — upgrades the globally installed arch CLI package to the latest version, runnable from within any governed repo
- `arch upgrade --protocol` — updates governance artifacts (AGENTS.md, TEMPLATE.md, task format) in the current repo to match the installed arch version
- Both as subcommands

Observable: running `arch upgrade` from a repo directory successfully updates the CLI and logs the version transition.

## Proposed solution
Minimal: `arch upgrade` shells out to `npm install -g @valentinlineiro/arch@latest`, prints version before/after, emits a chronicle signal for the upgrade event.

Extended: `arch upgrade --protocol` diffs current `AGENTS.md` / `docs/refinement/TEMPLATE.md` against the bundled canonical versions and offers to apply updates.

## Validation hints
- `arch upgrade` command exists in CLI help output
- Running `arch upgrade` in a test repo updates the npm global package
- Version before/after printed to stdout
- Chronicle entry emitted (if chronicle coverage IDEA lands first)

## Dependencies
- IDEA-chronicle-govern-coverage (for chronicle emit — optional, upgrade can land without it)

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
PROMOTE → TASK-1055, TASK-1056 — both scopes promoted as separate tasks. TASK-1055: arch upgrade CLI command (S). TASK-1056: arch upgrade --protocol governance artifact sync (M).
