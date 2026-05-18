# IDEA: capture-deterministic-default
**Created:** 2026-05-18
**Source:** Operator session — minimize LLM surface; moat value comes from accumulated signals, not inference
**Status:** DRAFT
**Meta:** P1 | S | claude | cli/src/main/ts/application/use-cases/create-task.ts, cli/src/main/ts/application/commands/capture-command.ts

## Problem

`arch task capture` calls `tryLlmDraft()` on every invocation. This is the only LLM call in the hot path (every task creation). The call:

- Adds latency on every capture
- Produces hallucinated titles, wrong size estimates, and off-target ACs at non-trivial rates
- Silently fails-closed to the deterministic scaffold when the provider is unavailable — meaning the deterministic path already handles the majority of cases adequately
- Requires a configured LLM provider for any capture, even when the operator knows exactly what they want

The deterministic scaffold (class-specific AC templates + intent as title fallback) is sufficient for XS/S operational tasks, which are the majority of capture traffic. LLM draft adds value for M+ tasks with complex intent, but is noise for routine work.

## Proposed Solution

**Make the deterministic scaffold the default. Gate LLM draft behind an explicit `--draft` flag.**

```
arch task capture "run db migration" --class 7-operations --size XS
# → deterministic scaffold, no LLM call, instant

arch task capture "implement JWT middleware with refresh token rotation" --draft
# → LLM draft invoked, title/size/ACs generated from intent
```

Changes:
1. `CreateTask.execute()`: skip `tryLlmDraft()` unless `draftMode: boolean` parameter is true
2. `CaptureCommand.execute()`: parse `--draft` flag, pass `draftMode` to `CreateTask`
3. Remove the silent fail-closed behavior — if `--draft` is specified but no provider is configured, fail explicitly with a clear message

## What this is not

- Not removing LLM from capture entirely — `--draft` keeps it available for complex intents
- Not changing the scaffold output for M+ tasks — the full template still applies based on size/class
- Not affecting THINK mode, memory ask, or any other LLM surface

## Dependencies

- None. Purely additive flag; existing behavior preserved behind `--draft`.

## Estimated size
S

## Gaps
<!-- THINK fills this section — do not edit manually -->

## Decision
<!-- Human writes PROMOTE → TASK-XXX or REJECT here -->
