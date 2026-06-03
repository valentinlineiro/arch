# ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing

## Status
ACCEPTED

## Context
Three bugs were identified in the exec/bridge execution layer following the unified-provider-strategies refactor (ADR-011):

1. **Unused `content` parameter in `BridgeProvider.buildCommand`:** The method accepted a `content: string` argument that was never read. Content is written to a temp file by the caller; the shell command uses `$(cat file)` to inject it. The parameter misled callers into believing content injection happened in-memory.

2. **Missing `maxBuffer` on `spawnSync` calls:** All `spawnSync` invocations that capture LLM CLI output used the Node.js default buffer of 1 MB. Long responses (e.g. full session transcripts, large diffs) exceeded this limit and threw `ENOBUFS`, silently killing the agent mid-run.

3. **`local` routing check before the candidates loop in ExecCommand:** The original code checked `candidates[0].name === 'local'` before entering the provider fallback loop. This bypassed the fallback mechanism — if a `local` entry appeared anywhere in the candidate list, the loop was never entered.

## Decision
Apply three targeted fixes:
1. Remove the `content` parameter from `BridgeProvider.buildCommand`; update all call sites.
2. Add `maxBuffer: Infinity` to all `spawnSync` calls that capture LLM CLI output (bridge-provider.ts, exec-command.ts, loop-engine.ts, sandbox.ts).
3. Move the `local` check inside the candidates loop in both ExecCommand and LoopEngine so it is evaluated only when `local` is the active candidate.

## Consequences
- **BridgeProvider API is a breaking change** for any caller passing a content string. All internal call sites are updated in the same change set. External callers (none currently) would need updating.
- **`maxBuffer: Infinity`** means Node.js will buffer the full stdout/stderr of the LLM subprocess. This is appropriate because the output is consumed in memory anyway; a finite cap only adds a failure mode.
- **Loop correctness** is restored: a `local` candidate at any position in the list now triggers the expected halt/display behavior rather than being silently skipped.
