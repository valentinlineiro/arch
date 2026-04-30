# IDEA: separate-review-context
**Created:** 2026-04-29
**Source:** human — `idea:` DO mode submission
**Status:** DRAFT
**Meta:** P0 | S | arch review | review protocol

## Problem
The executor cannot be the judge of its own work. When the agent that implemented a task also runs `arch review`, it carries implementation context that biases evaluation — it fills gaps from memory rather than from the actual state of the repository.

## Proposed solution
`arch review` executes with clean context — no implementation history, only ACs + real repository state. Protocol rule: the agent that locks a task cannot archive it. A task with failing ACs is not archivable even if the executor reports success.

## Dependencies
- Potentially IDEA-anti-hallucination-acs (executable ACs make clean-context review possible)

## Estimated size
S

## Gaps
- **Isolation Enforcement:** Spawn the Auditor as a fresh subprocess with no shared session state. In Claude Code: `claude -p "$(cat review-prompt.md)" --dangerously-skip-permissions` from a clean working directory. In `arch loop`: the loop engine spawns the Auditor as a child process after DO yields.
- **Handover Protocol:** DO agent writes a `REVIEW_REQUEST` entry to INBOX (task ID + AC list + changed files) then releases the lock. The Auditor reads INBOX, runs `arch review`, checks ACs against repo state, and writes result back to INBOX. DO does not archive until INBOX shows `REVIEW_PASS`.
- **L3 Autonomy:** `arch loop` spawns Auditor as a child process with `--no-session-inherit`. If Auditor returns FAIL, loop increments the Andon Cord counter (see IDEA-andon-cord) rather than retrying implementation directly.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
