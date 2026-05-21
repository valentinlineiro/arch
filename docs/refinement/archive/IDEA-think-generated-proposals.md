# IDEA: think-generated-proposals
**Meta:**Source: human | Status: DRAFT | Sessions: 1
**Created:** 2026-05-19

## Problem

When a human promotes an IDEA, they currently author the Decision field, AC template, size estimate, and rationale from scratch. This is mechanical reconstruction: the relevant context exists in the IDEA body, the archive, and prior precedents. The human is rewriting what the system could have composed.

This is bureaucratic friction (per `IDEA-governance-epistemic-doctrine`). Eliminating it does not transfer judgment — it removes the clerical layer before judgment.

## Proposed direction

When an IDEA enters human review, THINK generates a **complete promotion proposal**:
- Full task draft (title, class, size estimate, rationale)
- AC template with at least one `cmd:` or `file:` predicate per AC
- Novelty flag: explicit statement of whether this IDEA has precedent in the archive, and how close
- Uncertainty surface: where THINK is uncertain, it says so explicitly rather than eliding
- Recommendation authority boundary: proposal is labeled as preparation, not decision

The human reads a complete artifact and approves, rejects, or edits. They do not reconstruct.

**What this does not change:**
- The human still makes the promotion decision.
- THINK's proposal has no formal authority; the human Decision field is still required.
- Novelty adjudication remains human. If THINK flags novelty, the human decides how to handle it — THINK does not suggest a default.

**Constitutional alignment:**
Per `IDEA-governance-epistemic-doctrine`, machines may prepare but not legitimize governance. This change makes preparation thorough without touching legitimization.

## Governance class

Class: I (THINK output format change) + II (proposal scope definition)
Evaluates: Whether proposal completeness reduces mechanical reconstruction burden.
Does NOT evaluate: Decision quality. A complete proposal does not guarantee a good decision.
Boundary risk: If proposal quality becomes a proxy for decision validity ("THINK recommended this, so it's probably right"), the system slides toward recommendation ratification. The mitigation is explicit labeling and the novelty flag — proposals that surface uncertainty resist ratification more than confident-sounding ones.

## Decision
PROMOTE → TASK-966
