# ADR-009: L3 Self-Archive — Audited Autonomous Task Completion

**Date:** 2026-05-16
**Status:** Accepted
**Deciders:** Human Architect, Claude Sonnet 4.6
**Depends on:** ADR-019 (Hansei Ontology), TASK-207 (DeterministicACVerifier)

---

## Context

Every task completion currently requires a human Auditor to verify ACs and move the task file to `docs/archive/`. For XS and S tasks where all Acceptance Criteria have deterministic predicates (`cmd:`, `file:`), this is pure overhead — the verifier already produces binary, reproducible evidence with no human judgment required.

The autonomy model (see `docs/guidelines/autonomy.md`) defines four levels. L2 allows autonomous IDEA promotion for XS ops/writing tasks. L3 extends this to task archival when a deterministic gate passes.

The risk of L3 is that the agent could self-certify tasks where the verification evidence is weak or fabricated. The gate prevents this: the L3 path is only available when `DeterministicACVerifier.verify()` returns `pass: true` with at least one non-prose AC in the evidence set. Tasks where all ACs are `prose:` or `code:` (human/reader-verified) cannot self-archive — they require a human Auditor.

---

## Decision

Implement L3 self-archive with the following invariants:

**Gate conditions (all must be true):**
1. Task size is `XS` or `S`
2. `DeterministicACVerifier.verify()` returns `pass: true`
3. Evidence contains at least one `cmd:` or `file:` AC (not purely prose/code)

**Audit trail requirements:**
- INBOX entry written as `[AWAITING_REVIEW] TASK-XXX [L3-AUTO]` with full evidence table
- Commit message format: `done: [TASK-XXX] <title> [L3-AUTO]`
- `Approved-by: L3-AUTO | <ISO-date>` written to task `## Approval` section

**L3 fail fallback:**
- M/L tasks → standard flow, human Auditor required
- Any `cmd:` or `file:` AC fails → standard flow, human Auditor required
- All ACs are `prose:`/`code:` only → standard flow, human Auditor required

---

## Consequences

**What becomes easier:**
- XS/S tasks with deterministic ACs close without blocking on human availability
- Evidence trail is machine-readable and reproducible
- Audit coverage for L3 tasks is higher than current human review (verifier runs every predicate; human review is sampling-based)

**What becomes harder:**
- Tasks with only prose ACs cannot benefit from L3 — they require a human Auditor
- Operators must understand that `[L3-AUTO]` commits are machine-produced

**Rollback procedure:**
1. Set `governance.l3Enabled: false` in `arch.config.json`
2. Any L3-archived task can be re-opened by moving it from `docs/archive/` back to `docs/tasks/` with status `READY`
3. The evidence in the INBOX entry remains as an audit record regardless

---

## Alternatives Considered

**LLM-assisted gate:** Rejected. Model confidence scores are probabilistic, not deterministic. IDENTITY.md §7 — Deterministic Core Invariant prohibits LLM judgment in governance enforcement paths.

**L3 for all sizes:** Rejected. M/L tasks carry more systemic risk. The size constraint ensures L3 applies only to bounded, low-risk changes.

**No INBOX entry:** Rejected. The audit trail is the contract. An L3 self-archive without a human-readable record creates an unverifiable history.
