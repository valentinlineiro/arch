# IDEA: Cut GOVERNANCE.md epistemology — keep decision authority matrix only

**Status:** DRAFT
**Created:** 2026-06-03
**Source:** Protocol audit — GOVERNANCE.md is 109 lines, 60% is philosophy that doesn't change behavior
**Candidate-class:** 6-writing
**Candidate-size:** XS
**Depends:** none
**Decision:** Pending human review.

## Problem

GOVERNANCE.md opens with an Epistemic Frame section: "ARCH exists to externalize procedural discipline without externalizing epistemic responsibility." True and well-phrased, but it doesn't change any decision an agent makes. The Class I/II decision authority matrix is what agents actually need — who decides what, what triggers escalation. The rest is justification for the framework.

## Proposed solution

Rewrite to ~40 lines:
- Decision Authority Matrix (Class I: human decides, Class II: agent with human review, Class III: agent autonomous)
- Escalation triggers
- One-line epistemic principle as a header comment

Delete the rest.

## Validation hints

- GOVERNANCE.md ≤ 45 lines
- Class I/II/III authority split still present
- Escalation trigger table intact
