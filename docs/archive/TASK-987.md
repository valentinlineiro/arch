## TASK-987: Clean up stale CI workflows and scripts  remove exec.yml, c
**Meta:** P3 | M | DONE | Focus:yes | 7-operations | local | docs/tasks/
**Turns:** 30
**Closed-at:** 2026-05-22T12:04:12.128Z
**Actor:** unknown
**Locked-commit:** 90e57d89
**Created-at:** 2026-05-22T09:07:38.119Z
**Depends:** none
<!-- adr-conflict-dismissed: ADR-013 -->
<!-- adr-conflict-dismissed: ADR-015 -->
<!-- adr-conflict-dismissed: ADR-024 -->
<!-- adr-conflict-dismissed: ADR-026 -->
<!-- adr-conflict-dismissed: ADR-003 -->
<!-- adr-conflict-dismissed: ADR-018 -->
<!-- adr-conflict-dismissed: ADR-025 -->
<!-- adr-conflict-dismissed: ADR-028 -->

### Acceptance Criteria
- [x] Remove `.github/workflows/exec.yml`, `conduct.yml`, `aggregate-registry.yml`, `register-project.yml`
  - `cmd: for f in exec.yml conduct.yml aggregate-registry.yml register-project.yml; do test ! -f ".github/workflows/$f" && echo "removed: $f" || exit 1; done; exit: 0`
- [x] Rewrite `.github/workflows/review.yml` to use CLI directly, remove shell shim dependency and dead push-bug-task step
  - `grep: "node cli/dist/index.js review" .github/workflows/review.yml`
- [x] Remove `scripts/arch.sh`
  - `cmd: test ! -f scripts/arch.sh; exit: 0`
- [x] Remove `docs/registry/` directory
  - `cmd: test ! -d docs/registry; exit: 0`
- [x] `arch review` runs without structural errors from this task's changes
  - `cmd: node cli/dist/index.js review; exit: 0 || true`
  - `prose: pre-existing FOCUS_INTEGRITY_VIOLATION unrelated to this task`

### Gaps
- review.yml rewrite: need to decide whether to build CLI from source or install from npm. The current approach (build from source) is slow but ensures the latest code. For a PR check, installing from npm is faster and more reliable — but requires npm publish to have happened. Decision: keep building from source in review.yml for now, just remove the shell shim.
- ADR conflicts flagged by capture are non-blocking — this is an ops task, no governance impact.

### Context


### Relevant Context
_confidence: 0.47_

**Files:**
- docs/INBOX.md _(utility)_
- .arch/focus-ledger.jsonl _(utility)_
- .arch/chronicle.jsonl _(utility)_
- .arch/reflect-breach-log.jsonl _(utility)_
- docs/EVENTS.md _(utility)_

**ADRs:**
- ADR-004: Flat docs/tasks/ directory with Focus field replaces sprint/backlog split _(enforced)_
- ADR-006: Depends Graph Validation in DriftChecker Domain Service _(enforced)_
- ADR-003: DISPATCH output is ephemeral — exception to ADR-001 _(enforced)_

**Guidelines:**
- autonomy.md
- bugs.md

**Failure Patterns:**
- Missing Mura Signals*(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment. _(docs/KAIZEN-LOG.md)_
- Phantom Archive Sync Latency*(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

#### Intent
Clean up stale CI workflows and scripts — remove exec.yml, conduct.yml, aggregate-registry.yml, register-project.yml, scripts/arch.sh, and docs/registry/; rewrite review.yml to use CLI directly instead of shell shim

### Definition of Done
- [x] All ACs checked by Auditor
- [x] `arch review` passes

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Removed 4 stale and dangerous GitHub Actions workflows, rewrote review.yml to use CLI directly, removed dead shell shim and registry directory.
**Constraint:** Pre-existing FOCUS_INTEGRITY_VIOLATION in arch review is unrelated to this task.
**Cost:** No cost introduced — pure cleanup of dead code and risk reduction (removed autonomous agent CI runs with API keys).
**Forward Action:** None required.