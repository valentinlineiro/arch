# IDEA: Separate arch govern (enforcement) from arch reflect (analysis)
**Created:** 2026-05-12
**Source:** Deterministic Core Invariant — IDENTITY.md §7
**Status:** DRAFT
**Meta:** P1 | M | cli | cli/src/main/ts/index.ts, cli/src/main/ts/application/use-cases/govern-system.ts, docs/agents/THINK.md

## Problem
`arch govern` currently triggers THINK (via `arch conduct`) when replenishment or cadence rules fire. Enforcement and reflection share the same command boundary. This is technically correct — enforcement runs first, deterministically; THINK operates afterward in the proposals-only zone — but the naming is wrong.

The consequence is a comprehension failure: anyone reading the command surface sees `arch govern → THINK` and concludes that "governance uses LLM." That conclusion is false, but the design invites it. Systems that invite misreading will eventually be misread and extended accordingly.

The specific degradation to prevent: "THINK already participates in govern, so it can also…" — one exception, one confidence threshold, one "basically the same." That is how enforcement boundaries collapse.

## Proposed solution
Separate the two concerns into distinct commands with distinct identities:

- `arch govern` — Governance Enforcement. Deterministic, auditable. Archives DONE tasks, checks replenishment, enforces cadence rules, assigns focus, emits signals on violations. Never invokes LLM.
- `arch reflect` — Governance Analysis. LLM-permitted proposals layer. Regenerates INBOX, surfaces Kaizen signals, refines ideas, detects semantic drift, summarizes state. Never mutates task state, never satisfies policy gates.

`arch govern` may trigger `arch reflect` as an explicit, named side-effect when conditions warrant (replenishment threshold, cadence trigger). The trigger is deterministic; the side-effect is labeled as analysis, not enforcement.

## Dependencies
No blocking dependencies. Should be done before any feature that expands THINK's output surface (e.g. TASK-208 L3 self-archive, policy engine Phase 4).

## Estimated size
M

## Gaps

## Decision
PROMOTE → TASK-230 [influenced-by: none]
