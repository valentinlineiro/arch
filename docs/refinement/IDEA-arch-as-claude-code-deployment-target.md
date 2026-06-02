# IDEA: ARCH as native deployment target for Claude Code

**Status:** DEFERRED
**Created:** 2026-06-02
**Source:** Strategic — the strongest version of ARCH is Claude Code governing itself
**Candidate-class:** 1-code-reasoning
**Candidate-size:** M
**Depends:** TASK-1080
**Decision:** DEFERRED — TASK-1080 shipped. Condition: first external adopter successfully closes a task autonomously before this is promoted.

## Problem

The current ARCH model requires a human to invoke most lifecycle steps: arch task start, arch task done, arch govern. The autonomous loop (arch task loop) exists but hasn't been demonstrated end-to-end with a real task on a real repo without human intervention. The product vision — agents governing themselves — hasn't shipped as a product.

## Proposed Solution

A documented, tested pattern: Claude Code + ARCH on a repo with archProfile:minimal. Claude Code reads arch status, picks the focused task, implements it, runs arch task done, loops. Human sets direction (captures tasks), reviews output (arch review), handles ANDON_HALT. Everything else is autonomous.

Concretely:
1. A CLAUDE.md or .arch/agent-config.md that tells Claude Code how to interact with ARCH (read status, start task, done with Hansei, govern, repeat)
2. A tested demo repo showing the full loop running for 5 tasks without human intervention
3. arch task loop command that wraps steps 1-5 for any configured agent

## Validation hints

- 5 tasks closed autonomously by Claude Code on a real repo
- Human only intervenes on ANDON_HALT or explicit review request
- arch review passes after each autonomous session
