# IDEA: Remove or document 12 unwired commands from codebase

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Code audit — 12+ command files exist but are not wired in CommandDispatcher
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

Approximately 12 command files exist that are not wired in CommandDispatcher:
batch-command, conduct-command (partially), deps-command, exec-command, explain-command, lint-command, loop-command, merge-resolve-command, move-command, rank-command, report-command, sandbox-command, validate-command, verify-acs-command.

Some may be intentionally unwired (experimental). Most are dead surface that inflates the codebase and confuses contributors about what arch actually does. The 2-tier help (arch help / arch help --full) already hides most commands from new users — but the files still exist, still need to be understood, and some may have stale test coverage expectations.

Proposed action: audit each — wire it, document it, or delete it. No middle ground.

## Decision
