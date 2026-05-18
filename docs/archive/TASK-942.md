## TASK-942: Narrow arch memory ask scope - remove THINK-layer fields, tighten corpus dirs
**Meta:** P2 | S | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/use-cases/ask-corpus.ts, cli/src/main/ts/application/commands/ask-command.ts
**Closed-at:** 2026-05-18T20:00:00Z
**Depends:** TASK-938

### Context

`arch memory ask` is deterministic (token overlap, no LLM). However its output surface and corpus scope are broader than the tool's purpose: `causeGroups` and `recurringSignals` are THINK-layer outputs surfaced in a query tool; `docs/tasks` and `docs/guidelines` are in `CORPUS_DIRS` despite being covered by TASK-938's preflight; the `answer` field is a doc-retrieval hack from IDENTITY.md for DEFINITIONAL queries. The risk is that the broad surface invites LLM addition to "improve answer quality" — which would contradict the deterministic-by-design invariant.

### Non-Goals

- Not removing `arch memory ask` — it's a valid moat tool for locating past decisions
- Not adding LLM to compensate for narrowing
- Not affecting THINK mode (arch govern reflect)

### Acceptance Criteria

- [x] `arch memory ask` output no longer includes `causeGroups` or `recurringSignals` fields in stdout. Those fields are removed from `AskResult` or demoted to internal-only.  →  grep: `grep causeGroups ask-command.ts` → no output. `grep recurringSignals ask-command.ts` → no output. Confirmed.
- [x] `CORPUS_DIRS` in `ask-corpus.ts` is scoped to `docs/archive` and `docs/adr` only. `docs/tasks` and `docs/guidelines` removed.  →  grep: `CORPUS_DIRS = ['docs/archive', 'docs/adr']` at `ask-corpus.ts:38-41`. Confirmed.
- [x] The `answer` field is removed from `AskResult` (DEFINITIONAL query extraction from IDENTITY.md dropped).  →  grep: `grep answer ask-corpus.ts` (excluding comment line) → no output. `AskResult` interface has no `answer` field. Confirmed.
- [x] A comment in `ask-corpus.ts` documents the deterministic-by-design invariant (must not call LLM providers).  →  grep: `grep -i deterministic ask-corpus.ts` → `// Deterministic by design — this module must never call LLM providers.` at line 13. Confirmed.
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [x] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [x] `arch memory ask` is a pure corpus lookup tool with no THINK-layer bleed.
- [x] The deterministic invariant is documented in code.
- [x] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [SpecDrift]

**Decision:**
Narrowing is correctness, not reduction. The `causeGroups`/`recurringSignals` fields were added before the THINK boundary was formally written. They belong in `arch govern reflect`, not in a query tool. Removing them from `arch memory ask` output sharpens the layer boundary.

**Constraint:**
Any operator or agent relying on `causeGroups` from `arch memory ask` will lose that signal. Acceptable: the same signal is available via `arch govern reflect`, which is the authoritative surface for it.

**Cost:**
`AskResult` interface change breaks any downstream code reading those fields. Audit callers before implementing.

**Forward Action:**
After shipping, verify `arch govern reflect` surfaces equivalent pattern signals so no information is lost from the system.
