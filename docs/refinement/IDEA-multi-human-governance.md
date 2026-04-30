# IDEA: Multi-human governance — role-based approval and async consensus for teams
**Created:** 2026-04-30
**Source:** Strategic vision — ARCH assumes one governor; teams need role-based approval and conflict detection
**Status:** DRAFT
**Meta:** P2 | L | local | docs/GOVERNANCE.md, docs/INBOX.md, arch.config.json

## Problem
ARCH's governance model assumes a single human governor. For teams, this creates three problems: (1) a single point of failure — if the governor is unavailable, the loop halts; (2) no role differentiation — a junior developer's INBOX approval carries the same weight as a tech lead's for architectural decisions; (3) no conflict detection — if two humans give contradictory instructions in INBOX, the agent has no resolution protocol.

## Proposed solution
Extend `arch.config.json` with a `governance.roles` block:

```json
"governance": {
  "roles": {
    "tech-lead": ["valentinlineiro@gmail.com"],
    "contributor": ["*"]
  },
  "approvalRules": {
    "architectural": { "require": "tech-lead", "quorum": 1 },
    "operations": { "require": "contributor", "quorum": 1 },
    "major-change": { "require": "tech-lead", "quorum": 2 }
  }
}
```

INBOX entries are tagged with the required approver role. The loop only treats an INBOX response as valid if it comes from the correct role. Conflict detection: if two INBOX responses for the same item contradict each other, the loop halts and escalates to `tech-lead` before proceeding.

## Dependencies
TASK-148 (INBOX as governance surface — multi-human governance extends the INBOX protocol).

## Estimated size
L — must be decomposed before entering READY.

## Gaps
- Define how "comes from role X" is verified in a Git-based system (commit author email? signed commits?).
- Decide behavior when no role member is available (timeout → escalate vs timeout → halt).
- Handle the single-developer case gracefully — roles config should be optional, not required.

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
