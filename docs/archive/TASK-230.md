## TASK-230: Separate arch govern (enforcement) from arch reflect (analysis)
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/THINK.md
**Depends:** none

### Context
`arch govern` currently triggers THINK (via `arch conduct`), conflating enforcement and analysis under one command. The naming invites the misreading that "governance uses LLM." The specific degradation to prevent: "THINK already participates in govern, so it can also…" — the boundary collapses via exception accumulation.

See IDENTITY.md §7 (Governance: the mandatory split) and the target architecture stated there:
```
arch govern   → Governance Enforcement (deterministic, always correct)
arch reflect  → Governance Analysis (LLM, proposals only, never authority)
```

Promoted from IDEA-govern-reflect-split.

### Acceptance Criteria
- [x] `arch govern` runs enforcement only: archives DONE tasks, checks replenishment, enforces cadence, assigns focus, emits signals. No LLM invocation.
- [x] `arch reflect` runs analysis only: regenerates INBOX, surfaces Kaizen, refines ideas, detects semantic drift. Never mutates task state. Never satisfies policy gates.
- [x] `arch govern` may trigger `arch reflect` as an explicit named side-effect — labeled as analysis, not enforcement.
- [x] `scripts/arch.sh` routes both commands correctly.
- [x] IDENTITY.md §7 note ("This separation is a future implementation target, not yet complete") updated to reflect completion.
- [x] `arch review --commands` passes with both commands documented.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
- [x] `npm test` passes in `cli/`.

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
The `noConduct` flag on `GovernSystem.execute()` is now redundant (govern never calls conduct) but kept for backward compatibility — removing it would break callers passing the flag. The reflect command was restructured so that bare `arch reflect` runs THINK (matching AC intent), while `arch reflect influence` retains the diagnostics subcommand. The Commands drift check now validates govern and reflect are documented, closing the gap where these commands existed but were invisible to review.
