# IDEA: Compliance front door for enterprise/regulated buyer
**Created:** 2026-05-25
**Source:** Product strategy discussion
**Status:** DRAFT
**Meta:** P0 | L | local | docs/refinement/

## Problem
The PLG onboarding flow (progressive disclosure, value before explanation) is optimized for the already-burned developer who self-serves. The compliance/enterprise buyer has the inverse need: full depth visible and documented before they decide, because their procurement team must evaluate the whole system upfront. A CISO or procurement officer cannot wait to discover the ontology organically — they need a structured artifact they can hand to legal. The current `.jsonl` chronicle is not that artifact. Presenting the PLG flow to this buyer signals immaturity, not discipline.

## Proposed solution
A separate first interaction for the compliance buyer: `arch audit --report` generates a structured compliance report from the current repo state covering:
- Full governance rule inventory (every enforced constraint, its ADR source, its enforcement mechanism)
- Chronicle summary: governance actions taken, violations caught, AI suggestions accepted vs. rejected
- Enforcement separation attestation: machine-readable proof that no LLM output can bypass a governance gate
- Gap analysis: rules present, rules missing, rules recommended for the repo's detected stack

Output formats: human-readable PDF/Markdown for stakeholders, machine-readable JSON for procurement tools. The report should be SOC2-adjacent in structure (not claiming certification, but using familiar audit language). This is the same product as the developer flow; the front door surfaces the depth immediately rather than progressively.

## Dependencies
- IDEA-chronicle-govern-coverage (govern normal-path emit needed for chronicle summary to be meaningful)
- IDEA-generated-docs-coupling (governance rule inventory requires docs coupled to enforced state, not prose)

## Estimated size
L

## Gaps

## Decision
ROADMAP. Correctly deferred by 90-day sprint. Two hard dependencies are unmet: (1) chronicle normal-path emit (IDEA-chronicle-govern-coverage) — the chronicle summary in the report would be empty without it; (2) generated docs coupling (IDEA-generated-docs-coupling) — the governance rule inventory requires docs coupled to enforced state. You cannot audit what hasn't shipped. Moving to ROADMAP-IDEAS.md; revisit after Chronicle emit lands and at least one external user has run `arch review`.
