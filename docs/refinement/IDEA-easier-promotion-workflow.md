# IDEA: easier way to promote ideas
**Created:** 2026-04-29
**Source:** human feedback
**Status:** DRAFT
**Meta:** P3 | S | local | docs/agents/, cli/
<!-- cli: local | claude | gemini | human -->

## Problem
The current process for promoting an IDEA requires a human to manually edit a markdown file and then (optionally) run a command. This is high-friction for simple promotions.

## Proposed solution
Introduce an `arch promote IDEA-slug` command that:
1. Validates the IDEA exists.
2. Interactively asks for the target TASK-ID (or suggests the next one).
3. Automatically updates the IDEA file status and creates the TASK file.
4. Performs the atomic commit.

## Dependencies
None

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
