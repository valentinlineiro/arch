# GOVERNANCE.md
<!-- Decision authority matrix. Single source of truth for who decides what. -->

## Decision Authority

| Class | Who Decides | Scope |
|-------|------------|-------|
| I | Human | Architectural pivots, sprint goals, external commitments, budget |
| II | Agent + human review | ADR creation, task closure, sprint open/close, governance policy changes |
| III | Agent autonomous | Task start, INBOX hygiene, corpus index rebuild, metric refresh |

## Escalation Triggers

An agent MUST escalate to a human (write `[ANDON_HALT]` to INBOX and stop) when:
- A Class I decision is required to unblock a task
- A governance invariant is violated and cannot be self-healed
- The task requires access outside the repo boundary
- The agent detects a contradiction between two ADRs with no resolution path

## Constructive vs Bureaucratic Friction

ARCH enforces *constructive* friction: Hansei on closure, DoR before start, ACs before work. It rejects *bureaucratic* friction: ceremony for its own sake, rules that don't change outcomes.

When in doubt: if a rule cannot be stated in one sentence, it is probably two rules.
