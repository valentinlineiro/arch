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
- **Isolation Enforcement:** How to technically prevent the DO-agent's session history from being passed to the Review-agent (e.g., clearing `MEMORY.md` or using a fresh temporary directory).
- **Handover Protocol:** Define exactly what "handoff" looks like — does the DO agent explicitly call a `request-review` command?
- **L3 Autonomy:** How this applies when an agent is running in a loop — does it spawn a child process with a fresh identity?

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
