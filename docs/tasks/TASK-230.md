## TASK-230: Separate arch govern (enforcement) from arch reflect (analysis)
**Meta:** P1 | M | READY | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/index.ts, cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/THINK.md
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
- [ ] `arch govern` runs enforcement only: archives DONE tasks, checks replenishment, enforces cadence, assigns focus, emits signals. No LLM invocation.
- [ ] `arch reflect` runs analysis only: regenerates INBOX, surfaces Kaizen, refines ideas, detects semantic drift. Never mutates task state. Never satisfies policy gates.
- [ ] `arch govern` may trigger `arch reflect` as an explicit named side-effect — labeled as analysis, not enforcement.
- [ ] `scripts/arch.sh` routes both commands correctly.
- [ ] IDENTITY.md §7 note ("This separation is a future implementation target, not yet complete") updated to reflect completion.
- [ ] `arch review --commands` passes with both commands documented.
