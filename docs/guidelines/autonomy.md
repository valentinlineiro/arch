# Autonomy Levels & Delegation of Authority

This guideline defines the progression of agent independence within ARCH and the specific boundaries for autonomous decision-making.

## Governance & Source of Truth

The definitive matrix for decision-making authority is maintained in `docs/GOVERNANCE.md`. This file takes precedence over any individual task-level autonomy definitions.

## Communication & Escalation

Coordination between the Human and the Agent is facilitated via `docs/INBOX.md`. Any decision that requires human approval (as per GOVERNANCE.md) must be escalated to the INBOX for visibility and resolution.

## Autonomy Levels

| Level | Name | Description | Human Involvement |
|-------|------|-------------|-------------------|
| **L1** | **Assisted** | Agent implements human-defined tasks. Human approves every commit and promotion. | High (Every step) |
| **L2** | **Collaborative** | Agent can propose and promote low-risk tasks (XS) autonomously. | Medium (Review only) |
| **L3** | **Authorized** | Agent can approve its own PRs for specific "Safe" categories if tests pass. | Low (Async Audit) |
| **L4** | **Autonomous** | System self-heals, detects drift, and fixes it without human intervention. | Zero (Notification) |

---

## Autonomy Pilot (Level 2)
Agents are authorized to self-promote IDEAs to TASKS if they are sized **XS** and belong to class `7-operations` or `6-writing`. This is an **execution** of a human-written Decision, as defined in `docs/AGENTS.md`.

