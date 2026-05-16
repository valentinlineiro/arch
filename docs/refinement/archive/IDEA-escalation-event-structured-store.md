# IDEA: escalation-event-structured-store
**Created:** 2026-05-12
**Source:** Diagnostic — arch inbox command blind to ANDON_HALT and AWAITING_PROMOTION
**Status:** PROMOTED
**Sessions:** 0  <!-- resurrected 2026-05-16; prior sessions: 1 -->
**Meta:** P1 | S | local | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts, docs/agents/THINK.md

## Problem

`arch inbox` is blind to two governance states that directly gate execution:

- **ANDON_HALT**: written by `loop-engine.ts` and `sandbox-command.ts` to `docs/INBOX.md` as appended markdown. The command has no path to read it. Loop resumption requires human approval, but the command layer has no way to surface that an active halt exists.
- **AWAITING_PROMOTION**: written by THINK to `docs/INBOX.md` as a markdown section. The command has no path to read it. Human action is blocked on something the command doesn't know about.

Both states gate forward progress. Anything that gates execution or prevents state progression is runtime state, not audit log. They currently exist only in `docs/INBOX.md`, which `generate-inbox.ts` never reads. The command regenerates from first principles (task files, IDEA files, DriftChecker) — `docs/INBOX.md` is write-only from the command's perspective.

This is the same state model split as the drift/IDEA coverage gap, but with higher operational impact: ANDON_HALT blocks loop execution; AWAITING_PROMOTION blocks IDEA promotion. Both are invisible to the system that is supposed to surface them.

## Scope (strict)

This IDEA normalizes existing behavior into a shared state contract. It does not:
- Redesign the reflect system or `reflect-proposals.jsonl` / `reflect-decisions.jsonl`
- Introduce new escalation types beyond ANDON_HALT and AWAITING_PROMOTION
- Redesign TASK or IDEA lifecycle
- Modify governance philosophy

## Proposed solution

Introduce `.arch/escalations.jsonl` as the structured state layer for escalation events. This is the same pattern as `.arch/reflect-proposals.jsonl` — a parallel machine-readable record alongside the human-readable artifact.

### Event schema

```json
{
  "escalation_id": "ESC-<8-char-uuid>",
  "timestamp": "<ISO-8601>",
  "type": "ANDON_HALT | AWAITING_PROMOTION",
  "subject": "<task-id | idea-slug>",
  "reason": "<one-line description>",
  "status": "OPEN | RESOLVED",
  "resolved_at": "<ISO-8601 | null>",
  "resolved_by": "<token | null>"
}
```

`status` starts as `OPEN`. It transitions to `RESOLVED` when the human writes the resolution token (`APPROVE`, `REJECT`, `PROMOTE`). Resolution is appended — a new record with the same `escalation_id` and `status: RESOLVED` — never by mutation of the original entry.

### Write paths (three sites)

**`loop-engine.ts`** — currently writes ANDON_HALT to `docs/INBOX.md`. Add: append an `ANDON_HALT` event to `.arch/escalations.jsonl`. Keep the INBOX.md write for audit continuity; the JSONL becomes the authoritative state.

**`sandbox-command.ts`** — currently writes ANDON_HALT to `docs/INBOX.md` when sandbox approval is missing. Same: append to `.arch/escalations.jsonl`.

**THINK Phase 1 (INBOX Regeneration)** — currently appends `AWAITING_PROMOTION` sections to `docs/INBOX.md`. Add: append `AWAITING_PROMOTION` event to `.arch/escalations.jsonl` when surfacing an IDEA for human decision.

### Read path

**`generate-inbox.ts`** — add a step that reads `.arch/escalations.jsonl` and surfaces all `OPEN` events. ANDON_HALT events go into `urgent` (they block execution). AWAITING_PROMOTION events go into a new `escalations` section distinct from the refinement queue (they require human decision, not THINK evaluation).

### INBOX.md contract change

`docs/INBOX.md` becomes a rendered audit view. It retains the append-only ANDON_HALT and AWAITING_PROMOTION sections for human readability and historical continuity. It is no longer the source of truth for active escalation state. `generate-inbox.ts` does not read it.

#### Machine invariant (hard constraint — not a guideline)

> `docs/INBOX.md` is a human-only projection artifact. It is non-authoritative, potentially stale by design, and must not be used by any automated process for inference, validation, reconciliation, or control-flow decisions about system state. All governance decisions must be derived exclusively from structured state sources: `.arch/escalations.jsonl`, task files, IDEA files, and DriftChecker outputs.

This constraint is absolute. The following uses are prohibited even when locally reasonable:

- Reading INBOX.md to check completeness ("it's just a debug pass")
- Comparing INBOX.md against JSONL to detect divergence ("it's just reconciliation")
- Using INBOX.md as a validation overlay ("it's just a hint")

All of these are inference paths. Any automated process that reads INBOX.md is treating it as authoritative regardless of intent. The constraint is on the read, not on the purpose of the read.

No secondary representation of `docs/INBOX.md` content may be introduced for the purpose of state reconstruction, validation, or monitoring. A structured mirror, sync index, or completeness overlay of INBOX.md content is a shadow inference surface — it violates the machine invariant without violating its wording. The prohibition applies to all representations derived from INBOX.md, not only to direct reads.

#### Human invariant (interpretation contract)

Divergence between `docs/INBOX.md` and `arch inbox` output is **expected behavior, not a defect**. INBOX.md is an append-only audit trail written at event time. `arch inbox` is a live projection from structured state. They will differ after any governance event occurs, because INBOX.md records the event and the command reflects current state. A human observing that INBOX.md shows AWAITING_PROMOTION while `arch inbox` does not (or vice versa) is observing intentional projection divergence — not a consistency failure to be fixed.

Do not add reconciliation logic, sync passes, or "make them match" code. The divergence is structural and correct.

## What this does NOT change

`.arch/reflect-proposals.jsonl` and `.arch/reflect-decisions.jsonl` are a separate event domain (governance decisions). `.arch/escalations.jsonl` is a third domain (execution interrupts). They share naming convention and append-only semantics but are orthogonal schemas. Do not merge them.

## Estimated size

S — three write-path modifications, one read-path addition, one new JSONL store, no schema migration required for existing INBOX.md entries.

## Dependencies

None. `.arch/` directory exists. JSONL pattern is established.

## Structural admissibility (5-axis)

| Axis | Status | Note |
|------|--------|------|
| Dependency ordering | Satisfied | JSONL pattern operational in `.arch/`; no blocking prerequisite |
| Temporal validity | Satisfied | Two concrete failure cases demonstrated: ANDON_HALT invisible, AWAITING_PROMOTION invisible |
| Abstraction layer | Satisfied | Data model layer — not touching query layer or governance philosophy |
| Observability validity | Satisfied | `.arch/escalations.jsonl` is directly queryable once it exists |
| Priority displacement | Satisfied | Operational correctness fix; not blocked by `arch ask` v1 |

## Governance class

Class: I
Evaluates: whether a structured escalation event exists in `.arch/escalations.jsonl` for any active ANDON_HALT or AWAITING_PROMOTION state
Does NOT evaluate: whether the escalation reason is valid, whether the human's resolution was correct, or whether the ANDON_HALT condition has actually been remediated
Boundary risk: If a DriftChecker check were added that gates execution on "no OPEN escalations in JSONL," it would appear to be enforcing governance but would actually be verifying that the write path ran — not that the escalation was legitimately resolved. An operator who reads a `PASS` on such a check as "the system has no active halts" has crossed the boundary: `RESOLVED` in the JSONL means the resolution token was written, not that the underlying condition is safe.

## Decision
PROMOTE → TASK-896
