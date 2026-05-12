# IDEA: arch capture — intent capture with auto-generated task scaffold
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DECIDED
**Meta:** P1 | M | claude-code | cli/src/main/ts/

## Problem
Creating a task requires manual authoring of TASK file, ACs, complexity estimate, dependencies, and context. This ceremony makes ARCH feel like a documentation burden rather than an operational copilot.

## Proposed solution
`arch capture "<intent>"` generates a complete TASK file: ACs, complexity, dependencies, context inference, and tags. The human reviews and promotes to READY.

## Rationale
This is the single feature that most changes how ARCH feels. Without it, ARCH is a documentation system. With it, ARCH is a copilot. The transition from "system of documentation" to "operational copilot" happens here.

## Dependencies
None.

## Estimated size
M

## Gaps

## Decision
REJECT: arch capture and the INTENT artifact were removed from ARCH. The problem it solved (task creation friction) belongs to the DO protocol, not to a capture→scaffold pipeline. The artifact no longer has a target to promote into.
