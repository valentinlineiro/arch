## TASK-948: Enhance CLI UX with interactivity and local dashboard
**Meta:** P3 | S | REVIEW | Focus:no | 7-operations | local | docs/tasks/
**Actor:** unknown
**Created-at:** 2026-05-18T15:24:27.986Z
**Depends:** none

### Acceptance Criteria
- [x] Expose `arch status` command for quick sprint progress overview.
- [x] Make `arch task start` interactive in TTY mode when no ID is provided.
- [x] Implement `arch govern serve` to launch a local dashboard server.
- [x] Update `arch-viewer.html` to fetch from local API when on localhost.
- [x] Improve main help output with categorized commands.
- [ ] `arch review` passes
  - `cmd: node cli/dist/index.js review`

### Context
Users currently have to copy-paste task IDs and rely on the GitHub API for visualization. These changes improve the local development experience.

### Relevant Context
_confidence: 0.35_

**ADRs:**
- ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, buildCommand signature, local routing _(enforced)_

**Guidelines:**
- testing-a-change.md
- core.md

**Failure Patterns:**
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [x] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Enhance CLI UX with interactivity and local dashboard

### Definition of Done
- [ ] All ACs checked by Auditor
- [ ] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [AuditGap]
**Decision:** Implementation was straightforward. Local API added to 'serve' command allows dashboard to work offline.
**Constraint:** No significant constraints were encountered during the implementation of these UX features.
**Cost:** No architectural debt or significant cost was introduced in this task.
**Forward Action:** None required.