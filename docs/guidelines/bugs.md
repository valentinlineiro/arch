# Bug & Hotfix Protocol

## What counts as a bug in ARCH

A bug is **any detected misalignment in the system**, including:

- WARNs reported by `arch review` (command drift, version drift, path drift)
- Inconsistencies between documentation and actual CLI behavior
- Broken references in `AGENTS.md` or other protocol files
- Tasks archived as DONE with unchecked ACs

## Bug flow

1. **Detection:** `arch review` or THINK mode identifies the misalignment.
2. **Registration:** The agent creates a bug task directly in `docs/tasks/` with `Focus:yes` — it bypasses the refinement queue.
3. **Priority:** Bugs always take precedence over feature tasks. Address before continuing development.
4. **Resolution:** Standard DO flow — IN_PROGRESS → implement → DONE → archive.

## Severity classification

| Level | Criteria | Example |
|-------|----------|---------|
| P0 | Blocking — prevents the agent from operating correctly | Broken path in AGENTS.md, `arch review` returns exit 1 |
| P1 | Functional degradation — system operates but with friction | Command documented in README but not implemented |
| P2 | Cosmetic / warn — does not affect operation | Minor format inconsistency |

## Relationship with `arch review`

Every WARN from `arch review` is a bug. When detected during THINK or DO, the agent creates the corresponding task in `docs/tasks/` with the appropriate severity.

P0 bugs are set to IN_PROGRESS in the same commit they are created.
