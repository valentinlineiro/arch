# IDEA: correction-signal
**Created:** 2026-05-18
**Source:** Operator session — Moat architecture; Deterministic Core Invariant preservation
**Status:** DRAFT
**Meta:** P2 | M | claude | .arch/, cli/src/main/ts/application/use-cases/escalation-store.ts, docs/tensions/

## Problem

When a human corrects an agent — rejecting a proposed implementation, redirecting a task, or marking a review fail — that correction contains repo-specific knowledge. The agent's prior was wrong in a specific, documentable way. That signal currently goes nowhere.

REDIRECT and REVIEW_FAIL entries exist in `.arch/escalations.jsonl` and `docs/INBOX.md`, but they record that a correction happened, not what was wrong and why. A future agent reading the escalation log learns that TASK-XXX was redirected; it does not learn what assumption triggered the redirect.

The risk of capturing this naively is equal to the risk of not capturing it: raw correction text is ambiguous. "Human said no" can be a factual error, a style preference, an authority call, or a misunderstanding. A correction corpus built from unstructured text becomes a swamp that a future agent cannot safely query.

The goal is a structured correction signal with enough metadata to be discriminating — low enough friction to actually be captured, high enough structure to be aggregated without hallucination.

## Proposed schema

File: `.arch/correction-signals.jsonl`
Append-only. One JSON record per line. Schema:

```json
{
  "signal_id": "cs-<timestamp>-<4-char-random>",
  "timestamp": "<ISO 8601>",
  "source_type": "review_fail | redirect | human_reject | operator_override",
  "task_ref": "TASK-XXX",
  "file_refs": ["path/to/file.ts"],
  "adr_refs": ["ADR-XXX"],
  "category": "<Hansei controlled vocabulary>",
  "correction_kind": "factual | style | authority | scope",
  "summary": "<one sentence — what was wrong>",
  "corroboration_count": 1,
  "authority": "low | medium | high",
  "status": "open | clustered | promoted"
}
```

**Field definitions:**

- `source_type`: where the correction came from. `review_fail` = Auditor rejected; `redirect` = loop REDIRECT signal; `human_reject` = operator explicitly rejected a proposal; `operator_override` = human changed a committed file immediately after agent commit.
- `category`: uses the same controlled vocabulary as Hansei (`[SpecDrift]`, `[TypeHack]`, etc.). Required — this is the clustering key.
- `correction_kind`: the nature of the correction.
  - `factual`: the agent's claim was wrong (wrong API, wrong file path, wrong behavior).
  - `style`: the agent's output was correct but the operator prefers a different form.
  - `authority`: the agent operated outside its sanctioned scope.
  - `scope`: the agent implemented more or less than requested.
- `summary`: one sentence written by the correcting human or inferred from the REDIRECT/REVIEW_FAIL evidence. Minimum 10 characters. No vague phrases.
- `corroboration_count`: starts at 1. Incremented when a new signal matches an existing signal on `(category, correction_kind, file_refs)`.
- `authority`: starts at `low`. Promoted to `medium` when `corroboration_count ≥ 3`. Promoted to `high` only by explicit operator instruction.
- `status`: starts at `open`. Set to `clustered` when grouped into a TENSION. Set to `promoted` when it becomes an injected constraint.

## Clustering rule (corroboration → TENSION)

THINK Phase 2 (or explicit `arch govern reflect`) scans `.arch/correction-signals.jsonl` for open signals:
- Group by `(category, correction_kind)`.
- If a group has ≥ 3 signals with overlapping `file_refs` or `adr_refs`: surface as a TENSION proposal in `docs/tensions/`.
- Set matched signals to `status: "clustered"`.
- Never auto-promote to injected constraint. Human sets `authority: "high"` explicitly.

**Invariant preserved:** a single correction, even from a trusted human, does not become a reusable constraint. Only repeated, corroborated corrections with explicit authority promotion do.

## Capture points

Three integration points, in order of implementation priority:

1. **`arch task done --redirect`** or **REVIEW_FAIL close**: when the agent writes a REVIEW_FAIL or REDIRECT entry, prompt (or accept a `--correction` flag) for a one-line summary and category. Write the correction signal immediately.
2. **`arch govern approve` with an evidence note**: `arch govern approve TASK-XXX --correction "[TypeHack] agent used any-cast without Hansei disclosure"`. Writes a correction signal with `source_type: operator_override`.
3. **THINK-triggered capture**: during Phase 1 health evaluation, if a task has a REVIEW_FAIL in EVENTS.md with no matching correction signal, emit an `AWAITING_CORRECTION_CAPTURE` escalation. Prompts the human to fill it in during the next session.

## What this is not

- Not a free-form chat log. The `summary` field is one sentence with structure constraints.
- Not a direct source of injected constraints. Only `authority: high` signals can become constraints, and only after explicit promotion.
- Not a replacement for Hansei. Hansei is the agent's self-assessment; correction signals are the operator's external assessment. They are complementary, not redundant.

## Relationship to Active Constraint Injection

Once correction signals reach `authority: high` and are promoted, they become eligible for injection via the Active Constraint Injection preflight. The flow is:

```
correction event → correction signal (authority: low)
  → corroboration ×3 → TENSION (clustered)
    → operator promotes → authority: high
      → injected into arch task start preflight
```

This preserves the Deterministic Core Invariant: no single correction reaches the agent's decision context without deliberate human escalation through the corroboration chain.

## Dependencies
- `.arch/escalations.jsonl` for REDIRECT/REVIEW_FAIL event provenance. Pre-existing.
- IDEA-active-constraint-injection for the downstream injection path (can be implemented independently first).

## Estimated size
M

## Gaps
<!-- THINK fills this section — do not edit manually -->

## Decision
<!-- REJECT: <one-line rationale> -->
<!-- PROMOTE → TASK-XXX -->
<!-- EXTEND: <gap> until <event> -->
