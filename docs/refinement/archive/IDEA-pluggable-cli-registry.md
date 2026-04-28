# IDEA: Pluggable CLI registry for conduct/exec
**Created:** 2026-04-28
**Source:** TASK-082 post-mortem — adding a new CLI required edits in multiple places in arch.sh
**Status:** PROMOTED → TASK-086
**Meta:** P2 | S | 7-operations | scripts/arch.sh

## Problem
Each supported AI CLI (claude, gemini, …) is hardcoded as an `if/elif` chain inside `conduct` and `exec`. Adding a new CLI means editing the same branching logic in two places, knowing the exact flags for headless + permission-bypass mode, and keeping both cases in sync. This doesn't scale as the list of supported CLIs grows.

## Proposed solution
Introduce a declarative CLI registry — a small config block (e.g. in `arch.config.json` or a dedicated `arch.clis.json`) that maps CLI names to their headless invocation template:

```json
"clis": [
  { "bin": "claude", "conduct": "claude -p '{prompt}' --dangerously-skip-permissions" },
  { "bin": "gemini", "conduct": "gemini -p '{prompt}' -y" }
]
```

`arch.sh` iterates the list in order, finds the first available binary, and substitutes `{prompt}`. Adding a new CLI is a one-line config change with no shell logic to touch.

## Dependencies
None.

## Estimated size
S

## Gaps
<!-- THINK fills this section when invoked — do not edit manually -->

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
