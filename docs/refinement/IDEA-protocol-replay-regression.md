# IDEA: Protocol replay and regression testing — verify agent behavior is stable across model updates
**Created:** 2026-04-30
**Source:** Strategic vision — Git history enables replaying past decisions through fresh agents to detect behavioral drift
**Status:** DRAFT
**Meta:** P2 | L | local | cli/src/, docs/agents/

## Problem
When an AI model is updated (e.g. Claude releases a new version), agent behavior may change silently. A protocol step that worked reliably at v0.6.0 may produce different output at v0.7.0. Currently there is no way to detect this regression. The only signal is a future Andon Cord halt or a human noticing something wrong — both are late and expensive.

## Proposed solution
Implement `arch replay <commit-range>` — a command that re-runs a sequence of past agent decisions through a fresh session and compares outcomes:

1. For each commit in the range that was made by an agent (identified by co-author tag), extract the input state (repo state before commit) and expected output (what the commit actually did).
2. Run a fresh agent session with the same input state in an isolated worktree.
3. Compare: did the agent make the same decisions? Same files changed? Same commit message structure?
4. Report drift as a diff between expected and actual behavior.

This turns the full Git history into a behavioral test suite. Running `arch replay` after a model update catches regressions before they affect live work.

## Dependencies
IDEA-typed-protocol-schema (formal schema makes "same decision" comparison precise).
IDEA-executable-acceptance-criteria (structured ACs define what "correct behavior" means).

## Estimated size
L — must be decomposed before entering READY.

## Gaps
- Define "same decision" precisely — exact file content match, or structural equivalence (same ACs checked, same status transition)?
- Handle non-deterministic agent output (e.g. different but equivalent commit messages).
- Decide whether replay runs in CI automatically on model version change or is triggered manually.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
