# idea: Agent context control

- **Class:** 7-operations
- **Size:** S
- **Status:** draft

## Problem

Agents accumulate context during task execution, leading to unnecessary token usage and cost. Context persists even when no longer needed.

## Proposed Solution

Implement context reset for agents:

1. Clear agent context after each task completion
2. Add context budget limit before task start
3. Implement context usage tracking

## Source

Internal discussion — user feedback

---

**Promoted by:** human
**Promoted on:**