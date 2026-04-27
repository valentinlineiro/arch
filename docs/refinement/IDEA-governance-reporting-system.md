# IDEA: Governance & Reporting System (GOVERNANCE.md & INBOX.md)
**Created:** 2026-04-27
**Source:** Human request via THINK mode
**Status:** PROMOTED → TASK-068

## Proposal
Establish a formal contract for autonomous decision-making and a weekly dashboard to improve human-agent coordination.

### Artifact 1: GOVERNANCE.md
A clear contract defining the boundaries of autonomy:
- **System decides alone:** Executing READY tasks, opening PRs, Kaizen proposals, drift detection.
- **Requires human approval:** Merging PRs to main, promoting IDEA -> READY, modifying guidelines, deployments.
- **Requires approval + justification:** Architectural changes (ADR), external dependencies, schema changes.

### Artifact 2: INBOX.md
A weekly summary (e.g., every Monday) of:
- **Urgent Decisions:** Blockers, PR reviews, high-risk promotion requests.
- **Pending Proposals:** IDEAs waiting for promotion.
- **System Information:** Velocity, detected bugs (auto-tasks), costs.

### Artifact 3: Inbox Agent
A dedicated process/command (`arch inbox`) that scans the system state and generates `INBOX.md`.

## Evidence / Rationale
- **TASK-047:** Agent executed architectural changes (ADR) without explicit human confirmation. GOVERNANCE.md would have flagged this for the INBOX.
- **TASK-061:** Agent detected a bug but it stayed in the log. INBOX.md would have alerted the human.
- **Velocity:** High volume of tasks (35 in 48h) makes individual monitoring impossible.

## Decision
[TBD]
