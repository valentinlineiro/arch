## TASK-929: Fix actor routing reads wrong config key (config.routing vs config.strategies)
**Meta:** P2 | XS | IN_PROGRESS | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/mark-task-in-progress.ts

### Context

Promoted from IDEA-actor-routing-config-key (surfaced in TASK-927 audit).

`mark-task-in-progress.ts:resolveActor` reads `config.routing?.strategies ?? {}`. The real `arch.config.json` stores strategies at the top level as `config.strategies`, not under a `routing` key. `config.routing` is always `undefined`, so `strategies` is always `{}`, and actor resolution always falls through to `'unknown'`.

### Acceptance Criteria

- [ ] `resolveActor` reads `config.strategies` (top-level key).
- [ ] `config.defaultActor` fallback reads the correct top-level key.
- [ ] Actor field resolves to a non-unknown value when a matching strategy exists.

### Definition of Done
- [ ] Tests pass.
- [ ] `arch review` passes.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
