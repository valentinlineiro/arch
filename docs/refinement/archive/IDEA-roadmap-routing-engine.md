# IDEA: Routing Engine — intelligent model and provider selection per task
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** PROMOTED → ADR-011, ADR-013 (archived 2026-05-12 — work complete)
**Meta:** P1 | S | claude-code | arch.config.json, cli/src/main/ts/domain/services/provider-registry.ts

## Problem
Humans manually select models and providers per task. This creates inconsistency, cost inefficiency, and cognitive overhead. A small bugfix routed to an expensive reasoning model wastes money; an architecture decision routed to a cheap model produces poor output.

## Proposed solution
ARCH routes automatically by task class (code-generation, writing, reasoning) and size (XS, S, M, L), resolving to the optimal provider/model pair from a unified `strategies` configuration. Fallback chains ensure execution continues when primary providers are unavailable.

## Rationale
This converts ARCH into a multi-model runtime. The human declares intent; ARCH decides execution strategy. Separation of intent from execution is what distinguishes a protocol from a wrapper.

## Dependencies
None.

## Estimated size
S

## Gaps

## Decision
PROMOTE → ADR-011, ADR-013
