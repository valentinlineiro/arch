# IDEA: DISPATCH is stale
**Created:** 2026-04-27T00:00:00Z
**Source:** User request: "idea: dispatch is stale"
**Status:** PROMOTED → TASK-074
**Meta:** P2 | XS | local | docs/DISPATCH.md, docs/adr/ADR-003-dispatch-ephemeral.md, docs/INBOX.md

## Problem
`docs/DISPATCH.md` is stale and conflicts with the current ARCH model. It recommends already archived tasks and preserves a persisted handoff artifact even though ADR-003 defines DISPATCH as ephemeral terminal output and current human-agent coordination now flows through `docs/INBOX.md`.

## Proposed solution
Remove `docs/DISPATCH.md` from the live workflow or replace it with a minimal pointer that explicitly marks it as deprecated and redirects readers to `docs/INBOX.md` and the terminal-only DISPATCH model. Update any remaining references so the repository has a single current coordination path.

## Dependencies
none

## Estimated size
XS

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
