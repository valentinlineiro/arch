## IDEA: actor-routing-config-key

**Status:** PROMOTED
**Sessions:** 1
**Decision:** PROMOTE → TASK-929 (closed 2026-05-18). Fix implemented: read config.strategies (top-level); typeof guard skips model-routing arrays; falls through to config.defaultActor.

### Problem

`cli/src/main/ts/application/use-cases/mark-task-in-progress.ts:83` resolves the actor from config:

```typescript
const strategies: Record<string, string> = config.routing?.strategies ?? {};
```

But `arch.config.json` stores `strategies` at the top level, not under a `routing` key:

```json
{ "version": "...", "currentSprint": "...", "strategies": { ... }, ... }
```

`config.routing` is always `undefined`, so `strategies` is always `{}`, and actor resolution always falls through to `config.routing?.defaultActor ?? config.defaultActor ?? 'unknown'`. Actor-level metrics and routing are silently broken.

### Proposed Fix

Change the read to `config.strategies ?? {}` to match the actual config shape. If `routing` is intended as a future namespace, add the nested key to `arch.config.json` and migrate.

### Acceptance Criteria

- [ ] `mark-task-in-progress.ts` reads strategies from the correct config key.
- [ ] Actor field on tasks resolves to the configured value rather than `unknown`.
- [ ] `arch report` actor-level breakdown reflects real actor distribution.

### Decision-required: no
