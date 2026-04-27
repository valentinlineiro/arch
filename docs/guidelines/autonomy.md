# Autonomy Levels & Delegation of Authority

This guideline defines the progression of agent independence within ARCH and the specific boundaries for autonomous decision-making.

## Autonomy Levels

| Level | Name | Description | Human Involvement |
|-------|------|-------------|-------------------|
| **L1** | **Assisted** | Agent implements human-defined tasks. Human approves every commit and promotion. | High (Every step) |
| **L2** | **Collaborative** | Agent can propose and promote low-risk tasks (XS) autonomously. | Medium (Review only) |
| **L3** | **Authorized** | Agent can approve its own PRs for specific "Safe" categories if tests pass. | Low (Async Audit) |
| **L4** | **Autonomous** | System self-heals, detects drift, and fixes it without human intervention. | Zero (Notification) |

---

## Delegation of Authority Matrix (Level 3)

When operating at Level 3, the agent is authorized to merge changes without human approval **ONLY** if the following criteria are met:

| Category | Auto-Merge Allowed? | Constraints |
|----------|---------------------|-------------|
| **Documentation** | **YES** | `docs/` only. No changes to core protocols. |
| **Operations** | **YES** | Cleanup, stale file removal, status sync. |
| **Core Logic** | **NO** | `cli/src/` or `arch.config.json` always require human. |
| **Dependencies** | **NO** | `package.json` or lock files always require human. |
| **Bugs (P2)** | **YES** | Cosmetic fixes or non-functional drift. |
| **Features** | **NO** | New capabilities always require human approval. |

### Requirements for Auto-Merge:
1. `arch review` returns **OK**.
2. 100% of existing tests pass.
3. No tracked deletions in core directories.
4. Commit message prefixed with `[AUTO-MERGE]`.
