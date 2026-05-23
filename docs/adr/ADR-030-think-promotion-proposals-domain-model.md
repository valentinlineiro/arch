# ADR-030: THINK-generated promotion proposals as a first-class domain model

**Date:** 2026-05-23
**Status:** Accepted
**Deciders:** Valen (human)
**Source:** TASK-966 — EscalationMaturity violation: promotion-proposal.ts added to domain/models/ without a preceding ADR

## Context

TASK-966 implemented THINK-generated promotion proposals: when the agent is asked to promote an IDEA to a TASK, it produces a structured `PromotionProposal` with AC templates, novelty scoring (distance to nearest precedents in corpus), and uncertainty entries flagging fields requiring human judgment.

The implementation added `cli/src/main/ts/domain/models/promotion-proposal.ts` — a protected path under `cli/src/main/ts/domain/models/` — without a preceding ADR. The domain model layer is protected because changes to it affect the contracts that the entire application layer depends on.

## Decision

Accept the `PromotionProposal` domain model as a stable, first-class abstraction in ARCH's domain layer. The model captures:

- `ProposalAc`: a proposed acceptance criterion with a verifiability predicate
- `NoveltyInfo`: distance from nearest corpus precedents and cluster density
- `UncertaintyEntry`: fields the agent couldn't determine with confidence
- `PromotionProposal`: the root aggregate — advisory only, never auto-applies

The `advisory: boolean` field is a hard invariant: promotion proposals are never applied automatically. The human always reviews and decides. This is consistent with ADR-026 (epistemic layer separation) — the THINK layer produces proposals, the human layer decides.

## Consequences

- `PromotionProposal` is a stable interface. Changes require a new ADR.
- `advisory: true` is the only valid production value. Any path that sets `advisory: false` automatically is a protocol violation.
- The novelty scoring is informational only — a low novelty score does not block promotion.
- `UncertaintyEntry` fields are surfaced to the human before they decide, not silently defaulted.

## Compliance

`arch review` EscalationMaturity check will pass once this ADR is committed, as it resolves the unprotected protected-path modification from TASK-966.
