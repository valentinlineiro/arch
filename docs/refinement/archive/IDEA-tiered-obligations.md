## IDEA: tiered-obligations

**Status:** PROMOTED
**Sessions:** 1
**Decision:** PROMOTE → TASK-934

### Problem

All task sizes carry the same Hansei and Approval overhead. XS tasks require full structured Hansei (Severity, Category, Decision, Constraint, Cost, Forward Action) and `## Approval` sections — the same weight as M/L tasks. This is the primary structural cause of `TaskTemplateCompliance` drift accumulating faster than it can be cleared.

The existing L3 gate (ADR-009) already allows XS/S self-archive for tasks with verifiable ACs, but the protocol text and drift-checker use a blanket "all tasks ≥ TASK-195 need Hansei" rule that overrides the size-proportional intent.

### Proposed Tier Model (human-decided 2026-05-18)

**Hansei:**
- **XS:** No mandatory Hansei unless a triggering condition is met: blocker encountered, size miss (task was larger than estimated), or constitutional/process anomaly.
- **S:** Same triggered basis as XS. Lightweight Hansei only when triggered.
- **M:** Mandatory structured Hansei on every close.
- **L/XL:** Mandatory structured Hansei on every close.

**Approval:**
- Follow the existing self-archive gate logic (L3 gate, ADR-009), not a blanket "all human-reviewed tasks need Approval" rule.
- XS/S tasks with verifiable ACs that pass DeterministicACVerifier are exempt from `## Approval`.
- M/L tasks require explicit human approval before archiving.

### Implementation Surface

- `cli/src/main/ts/domain/services/task-validator.ts`: Hansei validation gated on size + trigger conditions, not blanket post-TASK-195.
- `cli/src/main/ts/application/use-cases/drift-checker.ts:checkApprovalPresent`: exemption logic updated to follow L3 gate (XS+S exempt when DeterministicACVerifier passes), not just class exemptions.
- `cli/src/main/ts/application/use-cases/drift-checker.ts` (HanseiPresent / TaskTemplateCompliance checks): size-aware Hansei requirement.
- `docs/TASK-FORMAT.md`: update obligation table to reflect tiers.
- `docs/AGENTS.md`: update archiving requirements section.

### Acceptance Criteria

- [ ] XS tasks without a triggering condition are not flagged for missing Hansei by `arch review`.
- [ ] S tasks without a triggering condition are not flagged for missing Hansei by `arch review`.
- [ ] M/L tasks are still required to have structured Hansei.
- [ ] `ApprovalPresent` warnings respect L3 gate logic (XS+S self-archive eligible tasks are exempt).
- [ ] `TaskTemplateCompliance` warning count drops after fix.
- [ ] `docs/TASK-FORMAT.md` and `docs/AGENTS.md` reflect the tier model.

### Decision-required: no

## Decision
PROMOTE → TASK-934. Tiered Hansei/Approval obligations by size: XS/S triggered-only, M+ mandatory.
