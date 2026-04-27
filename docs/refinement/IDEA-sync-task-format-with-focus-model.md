# IDEA: Sync task format with Focus model
**Created:** 2026-04-27
**Source:** Protocol review finding
**Status:** DRAFT
**Meta:** P1 | M | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/, docs/guidelines/

## Problema
The canonical task specification still describes the legacy `Sprint N | Backlog` model and monolithic task locations, while the validator and active protocols already operate on `Focus:yes | Focus:no` and `docs/tasks/`. This leaves the spec, parser, and agent instructions out of sync.

## Solución propuesta
Make `docs/TASK-FORMAT.md` match the current Focus-based model, or explicitly version it and mark the legacy sections as historical. Ensure the documented regex, status/location semantics, and examples align with the validator and current THINK/DO protocols. Add a review check if necessary so future schema changes cannot drift silently.

## Dependencias
Should review ADR-004 and current validator behavior before deciding whether the spec changes to match code or the code changes to match spec.

## Tamaño estimado
M

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
