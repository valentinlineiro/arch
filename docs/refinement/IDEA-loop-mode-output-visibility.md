# IDEA: Loop mode output visibility
**Created:** 2026-05-06
**Source:** human report
**Status:** DRAFT
**Meta:** P2 | XS | cli | local

## Problem
When running in `arch loop` mode, the output of the invoked AI CLIs (Claude Code, Gemini CLI, etc.) is suppressed. This makes it difficult for a human observer to monitor progress in real-time or understand what the agent is currently doing without waiting for the cycle to complete and checking logs/metadata.

In `LoopEngine.ts`, `spawnSync` is configured with `stdio: ['ignore', 'pipe', 'inherit']`, which pipes `stdout` to the parent process but doesn't stream it to the terminal.

## Proposed solution
Modify `LoopEngine.ts` to allow streaming of `stdout` from candidate providers while still capturing it for metadata parsing (turns, cost). This might involve using a T-pipe approach or switching to an asynchronous subprocess runner that can both stream and capture.

Alternatively, provide a `--verbose` or `--stream` flag to `arch loop` that enables real-time output.

## Dependencies
none

## Estimated size
XS

**Sessions:** 1

## Gaps
- Technical trade-off between `spawnSync` (simpler but blocks) and `spawn` (asynchronous, allows streaming).
- Output interleaving: ensure that metadata parsing (cost, turns) still works if the agent's output is mixed with terminal control sequences.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
