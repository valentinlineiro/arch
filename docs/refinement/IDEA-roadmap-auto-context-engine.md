# IDEA: Auto Context Engine — infer relevant files, commits, ADRs, and guidelines per task
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | M | claude-code | cli/src/main/ts/domain/

## Problem
Agents must manually construct context by loading docs wholesale, wasting tokens and missing relevant history. There is no mechanism to surface which files, ADRs, and guidelines are actually relevant to the task at hand.

## Proposed solution
ARCH infers context automatically before task execution: relevant files (from git history and imports), related commits, applicable ADRs, matching guidelines, and similar historical tasks. Context is injected into the task file as a `## Context Feedback` section before the agent begins.

## Rationale
This is the true technical core of Phase 1. Without auto-context, every agent session starts cold. With it, ARCH compounds institutional knowledge into every execution. The difference is between a tool and an infrastructure.

## Dependencies
arch capture (TASK-219).

## Estimated size
M

## Gaps

## Decision
PROMOTE → TASK-219
