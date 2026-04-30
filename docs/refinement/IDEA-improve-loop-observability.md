# IDEA: Improve autonomous loop observability and security
**Created:** 2026-04-30
**Source:** User feedback regarding cryptic output and deprecation warnings in `arch loop`.
**Status:** DRAFT
**Meta:** P2 | S | human | cli/src/main/ts/application/use-cases/loop-engine.ts, docs/agents/

## Problem
The `arch loop` output is currently sparse and mixed with low-level CLI warnings (true color, YOLO mode, ripgrep fallback). Furthermore, the use of `shell: true` in `spawn` calls triggers a Node.js `DEP0190` deprecation warning and poses a security risk.

## Proposed solution
1. **Structured Logging:** Implement a cleaner output format for the loop engine that suppresses sub-process noise unless in `--verbose` mode.
2. **Progress Indicators:** Add clearer start/end markers for each phase (GOVERN, SELECT, EXEC, REVIEW, ARCHIVE) with timestamps.
3. **Security Fix:** Refactor `LoopEngine.ts` to pass arguments as an array without `shell: true` to resolve the `DEP0190` warning.
4. **Agent Telemetry:** Capture and summarize agent activity (e.g., "3 files modified, 1 commit created") at the end of the EXEC phase.

## Dependencies
- none

## Estimated size
S

## Decision
AWAITING_REVIEW
