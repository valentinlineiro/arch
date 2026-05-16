## TASK-896: Introduce .arch/escalations.jsonl as structured escalation state store
**Meta:** P1 | S | DONE | Focus:no | 1-code-reasoning | claude-code | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/sandbox-command.ts, cli/src/main/ts/application/use-cases/generate-inbox.ts, docs/agents/THINK.md
**Closed-at:** 2026-05-16T13:12:10.430Z

**Depends:** none

### Context

`arch inbox` is blind to two governance states that gate execution: `ANDON_HALT` and `AWAITING_PROMOTION`. Both are written as markdown to `docs/INBOX.md`, which `generate-inbox.ts` never reads (it regenerates from structured state). This means the command has no path to surface active halts or pending promotions — they are invisible to the system that should surface them.

**Machine invariant (hard constraint):** `docs/INBOX.md` is a human-only projection artifact. It is non-authoritative, potentially stale by design, and must not be used by any automated process for inference, validation, or control-flow decisions. All governance decisions must be derived exclusively from structured state sources.

### Acceptance Criteria

- [x] `.arch/escalations.jsonl` schema implemented with fields: `escalation_id`, `timestamp`, `type` (ANDON_HALT | AWAITING_PROMOTION), `subject`, `reason`, `status` (OPEN | RESOLVED), `resolved_at`, `resolved_by`. Append-only: resolution is a new record, not mutation of original.
  - `file: cli/src/main/ts/infrastructure/filesystem/escalation-store.ts`

- [x] `loop-engine.ts`: on ANDON_HALT, append event to `.arch/escalations.jsonl` in addition to existing INBOX.md write.
  - `file: cli/src/main/ts/application/use-cases/loop-engine.ts`

- [x] `sandbox-command.ts`: on missing sandbox approval, append ANDON_HALT event to `.arch/escalations.jsonl`.
  - `file: cli/src/main/ts/application/commands/sandbox-command.ts`

- [x] THINK Phase 1 doc: when surfacing AWAITING_PROMOTION, instruction updated to append event to `.arch/escalations.jsonl`.
  - `file: docs/agents/THINK.md`

- [x] `generate-inbox.ts`: reads `.arch/escalations.jsonl`, surfaces all OPEN events. ANDON_HALT events rendered as urgent (block execution). AWAITING_PROMOTION events rendered in a dedicated `escalations` section.
  - `cmd: node cli/dist/index.js inbox`

- [x] `arch review` passes clean after implementation.
  - `cmd: node cli/dist/index.js review`

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes
- [x] `npm test` passes in `cli/`

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Already fully implemented. EscalationStore exists with correct schema, loop-engine and sandbox-command write ANDON_HALT events, THINK.md documents AWAITING_PROMOTION writes, generate-inbox reads open escalations and surfaces them. IDEA predated the implementation that satisfied it.
**Constraint:** Escalation IDs in current .arch/escalations.jsonl use full UUID format, not ESC-<8-char> prefix as specified. Functionally equivalent — no change warranted.
**Cost:** None — no implementation needed.
**Forward Action:** None.
