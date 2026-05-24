# IDEA: cli-architecture-drift-review
**Created:** 2026-05-18
**Source:** Human suggestion: "Review the architecture of the CLI. I see it's drifting from clean architecture, too much comments"
**Status:** DRAFT
**Sessions:** 2 | **Decision-required:** yes
**Meta:** P2 | S | claude | cli/src/main/ts/, cli/src/test/ts/

## Problem
The CLI appears to be drifting away from the intended clean architecture boundaries. Symptoms called out explicitly are architectural leakage and excessive comments, which usually indicate logic accumulating in the wrong layer, weak naming, or flow complexity that the code no longer explains on its own.

There is already an archived IDEA about refactoring the CLI entrypoint, but this concern is broader: it asks for a repository-level review of the CLI's current structure, boundary discipline, and readability practices.

## Proposed solution
Run an architectural review of the CLI with three outputs:

1. A map of the current boundary violations or likely drift points across `application/`, `domain/`, `infrastructure/`, and command wiring.
2. A readability audit that distinguishes necessary explanatory comments from comment volume caused by unclear code structure.
3. A recommendation set split into:
   - direct refactors worth doing now
   - issues that should become TASKs
   - issues that are acceptable debt for the current phase

## Dependencies
none

## Estimated size
S

## Gaps

## Decision

DEFERRED: CLI architecture drift is reviewed continuously via arch check and DriftChecker. No separate review process needed.

PROMOTE → TASK-970 (code quality audit process)
PROMOTE → TASK-968
