# IDEA: Enforce TASK-ID in commit messages via commit-msg hook
**Created:** 2026-04-30
**Source:** THINK Phase 3 Kaizen — arch review flagged commit 465d87d missing [TASK-ID]; recurring friction pattern
**Status:** PROMOTED
**Meta:** P2 | S | local | .git/hooks/, cli/src/, docs/guidelines/core.md

## Problem
`arch review` periodically flags commits that are missing a `[TASK-ID]` reference. These are small fixes or maintenance changes made outside the formal task flow. The violation is caught after the fact — the commit is already in history and the only remediation is a note in the review report.

## Proposed solution
Add a `commit-msg` git hook that validates commit messages at commit time. Rules:
- Allow commits whose message matches `[TASK-XXX]` pattern.
- Allow exempted prefixes: `idea:`, `chore: open sprint/`, `chore: close sprint/`, and any `[THINK]`-tagged autonomous commits.
- Block everything else with a clear error message pointing to the format spec.

The hook should be installed via a setup script (e.g. `scripts/install-hooks.sh`) so it is opt-in per developer and not silently injected. Document the installation step in `DEVELOPMENT.md`.

## Dependencies
None.

## Estimated size
S

## Gaps

## Decision
PROMOTE → TASK-151
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
