## TASK-929: Fix actor routing reads wrong config key (config.routing vs config.strategies)
**Meta:** P2 | XS | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts
**Closed-at:** 2026-05-18T09:00:00Z

### Context

Promoted from IDEA-actor-routing-config-key (surfaced in TASK-927 audit).

`mark-task-in-progress.ts:resolveActor` reads `config.routing?.strategies ?? {}`. The real `arch.config.json` stores strategies at the top level as `config.strategies`, not under a `routing` key. `config.routing` is always `undefined`, so `strategies` is always `{}`, and actor resolution always falls through to `'unknown'`.

### Acceptance Criteria

- [x] `resolveActor` reads `config.strategies` (top-level key).
- [x] `config.defaultActor` fallback reads the correct top-level key.
- [x] Actor field resolves to a non-unknown value when a matching strategy exists.

### Definition of Done
- [x] Tests pass.
- [x] `arch review` passes.

## Approval

**Approved-by:** human (via TASK-927 triage)
**Approved-at:** 2026-05-18T09:00:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Fixed by reading `config.strategies` (top-level) instead of `config.routing?.strategies`. Added a `typeof actor === 'string'` guard so the code safely skips the model-routing arrays that currently live in `config.strategies` and falls through to `config.defaultActor`. Actor routing to string-valued actors will work correctly when configured; model-routing entries are silently skipped.
**Constraint:** `config.strategies` currently maps class names to model provider arrays, not to actor strings. Actor-level routing requires either a separate config key or a different convention. This fix makes the code correct for the intended config shape without breaking the existing model routing.
**Cost:** One session. The config key mismatch was invisible — actors always resolved to unknown with no error.
**Forward Action:** If actor-level routing is needed, add a `defaultActor` field to `arch.config.json` and document the string-vs-array distinction in the config schema.
