# IDEA: anti-hallucination-acs
**Created:** 2026-04-29
**Source:** human — `idea:` DO mode submission
**Status:** DRAFT
**Meta:** P0 | M | arch review | task execution

## Problem
Agents mark tasks DONE without verifying acceptance criteria. ACs written as prose descriptions are ambiguous — the executing agent self-certifies completion without objective verification.

## Proposed solution
ACs as executable assertions with explicit expected output — not descriptions, but commands with verifiable results that a third party (or low-cost model) can reproduce. Each AC specifies: command to run + expected output or exit code. A task is only archivable if all AC commands produce the expected output.

## Dependencies
- Potentially IDEA-separate-review-context (clean review context enforces who runs ACs)

## Estimated size
M

## Gaps
- **Safety:** Protocol for sandboxing or limiting AC commands to prevent accidental system damage during autonomous review.
- **Cross-platform:** AC commands must be executable in both Linux (agent default) and Windows (if human operator uses it).
- **Non-determinism:** Strategy for handling dynamic outputs (e.g., dates, hashes, random IDs) in verification strings.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
