# idea: Parallel task execution with merge conflict handling

- **Class:** 7-operations
- **Size:** L
- **Status:** REJECTED

## Problem

Running tasks in parallel with different CLIs creates conflicts when they modify the same files. No system to resolve collisions.

## Proposed Solution

Handle parallel task execution:

1. Detect file overlap before execution
2. Add file locking mechanism
3. Implement automatic merge conflict resolution
4. Queue tasks that would collide

**Sessions:** 2

## Source

Internal discussion — user feedback

---

**Promoted by:** human
**Promoted on:**

## Decision
REJECT: Gated on feature-branch-workflow which is itself deferred. No anti-collision mechanism exists yet.
