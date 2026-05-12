# IDEA: Verbose fallback logging for provider switching
**Created:** 2026-05-06
**Source:** User suggestion during provider fallback implementation
**Status:** DRAFT
**Meta:** P2 | XS | cli | arch.config.json

## Problem
When the system falls back from a preferred provider to an alternative, the transition might be silent or insufficiently explained. Users need to know exactly why the primary provider failed and that the system is taking corrective action by switching.

## Proposed solution
Implement more descriptive and visually distinct logging when the `ProviderRegistry` identifies multiple candidates and when a transition occurs.
1. In `ExecCommand` and `LoopEngine`, log the full list of candidates being considered if a `--verbose` flag is present.
2. Ensure the error message from the failing provider (stdout/stderr or exception message) is clearly demarcated before the "Trying next..." log.
3. Use consistent color-coding (e.g., Yellow for WARN/Fallback) to make the transition obvious in the terminal.

## Dependencies
- TASK-211 (Completed)

## Estimated size
XS

**Sessions:** 2

## Gaps
- Integration with `cli/src/main/ts/infrastructure/cli/format.ts`: should fallback logs have a dedicated visual style (e.g., `fmt.warn`)?
- Performance: ensure verbose logging doesn't slow down the loop in high-throughput scenarios.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
