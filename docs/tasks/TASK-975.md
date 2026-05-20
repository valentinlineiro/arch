## TASK-975: Bug: arch govern INTEGRITY_FIX writes ledger entry but does 
**Meta:** P3 | XS | READY | Focus:no | 2-code-generation | local | docs/tasks/
**Depends:** none

### Acceptance Criteria
- [ ] Implementation file exists at declared context path
  - `file: (path)`
- [ ] Tests pass
  - `cmd: npm test; exit: 0`
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context

### Relevant Context
_confidence: 0.51_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/domain/task.ts _(core)_
- cli/src/main/ts/application/use-cases/focus-ledger.ts _(domain)_
- cli/src/main/ts/domain/services/archive-parser.ts _(core)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-002: Context as a budget, not a default _(enforced)_
- ADR-021: Refinement funnel TTL and admission gate _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Bug: arch govern INTEGRITY_FIX writes ledger entry but does not rewrite Focus:yes to Focus:no in archived task files, causing the same set of archived tasks to trigger INTEGRITY_FIX on every govern tick

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes