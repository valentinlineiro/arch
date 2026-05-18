## IDEA: lock-model-contradiction

**Status:** DRAFT
**Sessions:** 1
**Decision:** UNDECIDED

### Problem

The lock model is internally contradictory and the persisted lock boundary is not round-tripped:

1. `docs/agents/DO.md:16` says to "add lock in Meta line."
2. `docs/AGENTS.md:126` says "Lock fields (lockedBy, lockedAt) are in-memory only. Never write them to the meta line."

These two instructions directly contradict each other.

3. The implementation (`cli/src/main/ts/infrastructure/filesystem/markdown-task-repository.ts:88`) writes `Locked-commit` as a side field.
4. The parser (`markdown-task-repository.ts:145`) never reads `Locked-commit`, `Actor`, or `Turns` back on load. The persisted boundary is dropped silently on reload.

The result: the system defines a deterministic diff boundary, writes it to disk, and then ignores it when the file is next read.

### Proposed Fix

Decide which model is canonical:

- **Option A (in-memory):** Remove the `Locked-commit` write from the repository. Update DO.md to match AGENTS.md. Locks are session-scoped only.
- **Option B (persisted):** Round-trip `Locked-commit` through the parser. Update AGENTS.md to match DO.md. Add a drift check that warns on stale lock fields.

### Acceptance Criteria

- [ ] `docs/AGENTS.md` and `docs/agents/DO.md` agree on whether lock fields are written to the meta line.
- [ ] If persisted: parser reads `Locked-commit` back. If in-memory: write removed from repository.
- [ ] `arch review` does not surface false stale-lock warnings after the fix.

### Decision-required: yes
