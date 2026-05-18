## TASK-941: Capture deterministic by default - gate LLM draft behind --draft flag
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/use-cases/create-task.ts, cli/src/main/ts/application/commands/capture-command.ts
**Depends:** none

### Context

`arch task capture` calls `tryLlmDraft()` on every invocation — the only LLM call in the hot path. It adds latency, produces hallucinated titles/sizes/ACs at non-trivial rates, and silently fails-closed to the deterministic scaffold when no provider is configured. The deterministic scaffold already handles the majority of capture traffic adequately. LLM draft adds value for complex M+ intents but is noise for routine XS/S operational tasks.

### Non-Goals

- Not removing LLM from capture entirely — `--draft` keeps it available
- Not changing scaffold output shape (that was TASK-937)
- Not affecting THINK mode or any other LLM surface

### Acceptance Criteria

- [ ] `arch task capture "<intent>"` with no `--draft` flag never calls `tryLlmDraft()` and completes without an LLM provider configured.  →  prose: verified by running capture without a provider and confirming task is created
- [ ] `arch task capture "<intent>" --draft` invokes `tryLlmDraft()` and uses the result if a provider is available.  →  prose: verified by inspecting CreateTask execution path with --draft
- [ ] `arch task capture "<intent>" --draft` with no provider configured fails explicitly with a clear error message (not silent fallback to defaults).  →  prose: verified by running --draft with no provider and confirming error output
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [ ] A developer running `arch task capture` never waits for an LLM call unless they explicitly opt in.
- [ ] The `--draft` flag is documented in capture help text.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Deterministic default eliminates the primary LLM hot path. The silent fail-closed behavior in `tryLlmDraft` was a latent ambiguity — operators running without a provider got different output silently. Explicit error on `--draft` without provider is the correct behavior.

**Constraint:**
Operators who relied on implicit LLM drafting (without knowing it was happening) will see a behavior change. Acceptable: the deterministic scaffold was already the fallback, so output quality is unchanged when no provider was configured.

**Cost:**
Operators with complex intents who want LLM-assisted task drafting must now use `--draft` explicitly. One extra flag for a minority use case.

**Forward Action:**
After shipping, monitor whether `--draft` usage rate indicates demand for LLM-assisted capture. If near-zero, consider removing `tryLlmDraft` entirely in a follow-on.
