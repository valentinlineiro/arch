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

## L3 Sprint Eligibility

L3 allows an agent to execute an entire sprint without per-task human intervention, halting only on Andon Cord conditions. Eligibility is determined per task class:

| Task Class | L3 Eligible | Condition |
|------------|-------------|-----------|
| `6-writing` | Yes | Default — no annotation required |
| `7-operations` | Yes | Default — no annotation required |
| `2-code-generation` | Conditional | Requires explicit `L3:yes` annotation in the sprint definition |
| All others | No | Must escalate to human per task |

**Sprint definition annotation** — to mark a sprint as L3-eligible for code-generation tasks, add `L3:yes` to the sprint header in `arch.config.json` or the sprint definition document. Without this annotation, `arch loop --sprint` will still run but will halt before each `2-code-generation` task for human approval.

**Governance gates** (apply regardless of L3 eligibility):
- Sprint halts with `ANDON_HALT` if more than 2 consecutive tasks hit Andon Cord conditions.
- A `SPRINT_CHECKPOINT` entry is written to `docs/INBOX.md` when 50% of sprint tasks are archived, pausing for async human review. Resume with `arch loop --sprint <slug> --resume`.

