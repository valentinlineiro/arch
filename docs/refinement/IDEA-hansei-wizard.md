# IDEA: hansei-wizard
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

Hansei authoring is currently high-friction. The required fields (Severity, Category, Decision, Constraint, Cost, Forward Action) must be recalled from memory, typed in the correct format, and validated against the schema. Violations fail `arch review`, creating a rework loop.

This is pure bureaucratic friction. The schema is fixed; the structure is deterministic; the human's cognitive contribution is the content, not the format. The agent spends effort on serialization instead of reflection.

## Proposed direction

`arch task hansei TASK-XXX` — an interactive wizard that:
1. Reads the task diff and AC outcomes to pre-fill context
2. Prompts for each required field in sequence with the controlled vocabulary visible
3. Validates each field inline (length ≥10 chars, no prohibited vague phrases, H2/H3b link requirements)
4. Assembles the `## Hansei` block and appends it to the task file
5. Runs `arch review` to confirm the block passes before exiting

The human provides judgment (what went wrong, what the forward action is). The wizard handles structure, validation, and field ordering.

**Out of scope:**
- THINK-generated Hansei content. Hansei is a reflection artifact; auto-generated content defeats its purpose.
- Severity auto-assignment. Severity is a human judgment call (H0–H3b have different consequences).

**Constitutional alignment:**
Serialization support only. No judgment transferred. This is the cleanest Phase 1 item.

## Governance class

Class: I
Evaluates: Whether the Hansei block is structurally valid.
Does NOT evaluate: Whether the reflection is accurate or the forward action is sound — those remain human.
Boundary risk: Negligible. The wizard cannot produce a valid Hansei block with wrong content faster than a human can — it only removes the format overhead.
