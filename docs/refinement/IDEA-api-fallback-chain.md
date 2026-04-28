# IDEA: Handle API exhaustion and include opencode as fallback option for easy tasks
**Created:** 2026-04-28
**Source:** arch conduct failed due to Gemini API quota exhaustion
**Status:** PROMOTED → DONE (implemented in scripts/arch.sh invoke_agent)
**Meta:** P1 | S | cli | local

## Problem
`arch conduct` fails when the primary AI API (Gemini) is exhausted, preventing THINK mode from running. Easy tasks (scanning files, basic transformations) could be handled by alternative CLIs like opencode without requiring quota.

## Proposed solution
1. Detect API exhaustion errors in conduct workflow
2. Implement fallback chain: Gemini → OpenCode → Claude Code → local deterministic review
3. Route tasks by complexity: XS tasks go to lightweight CLI, M+ tasks use primary API
4. Cache quota usage and auto-switch when threshold reached

## Dependencies
- None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->