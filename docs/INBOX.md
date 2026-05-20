# ARCH INBOX

## Loop Status
- **Active Tasks:** 2 (TASK-259, TASK-919)
- **READY Tasks:** 47

## Pending Items
- **AWAITING_REVIEW:** 
  - TASK-968
  - TASK-963
  - TASK-974
  - TASK-972
  - TASK-919
  - TASK-940
  - TASK-283
  - TASK-939
  - TASK-955
  - TASK-956
  - TASK-958
  - TASK-959
  - TASK-960
- **AWAITING_PROMOTION:** 
  - IDEA-archive-parser-skip-non-done
  - IDEA-automate-turn-count
  - IDEA-automatic-sprint-lifecycle
  - IDEA-cli-architecture-drift-review
  - IDEA-deterministic-ac-expansion
  - IDEA-deterministic-governance-gates
  - IDEA-done-command-ac-section-scoping
  - IDEA-fix-class-boundary-violation-excision
  - IDEA-governance-epistemic-doctrine
  - IDEA-guided-close-path
  - IDEA-hansei-wizard
  - IDEA-semantic-compression-layer
  - IDEA-status-doc-refresh
  - IDEA-think-generated-proposals
  - IDEA-verifiability-first-templates

## Refinement Queue
- archive-parser-skip-non-done
- automate-turn-count
- automatic-sprint-lifecycle
- cli-architecture-drift-review
- code-quality-audit-process
- deterministic-ac-expansion
- deterministic-governance-gates
- done-command-ac-section-scoping
- fix-class-boundary-violation-excision
- governance-epistemic-doctrine
- guided-close-path
- hansei-wizard
- semantic-compression-layer
- status-doc-refresh
- think-generated-proposals
- verifiability-first-templates

## Recently Completed
- TASK-950: Introduce size-tiered closure and review obligations
- TASK-949: Implement L3 self-archive for XS/S tasks
- TASK-948: Enhance CLI UX with interactivity and local dashboard
- TASK-946: 1.0.0 release: fix reflect modePreamble bug, collapse context feedback, Metrics Narrowing, version bump
- TASK-945: replace bash scripts/arch.sh references with arch CLI binary

## [AWAITING_REVIEW] TASK-947 [L3-AUTO]
**Closed:** 2026-05-19T10:50:34.760Z
**Title:** Bug: getById reads all 340 tasks+archive files to find a task with a known ID

| AC | Type | Pass | Detail |
|---|---|---|---|
| `getById(id)` reads only `docs/tasks/${id}.md` then `docs/ar | file | ✔ | exists: cli/src/main/ts/infrastructure/filesystem/markdown-t |
| `getNextId()` uses filename-only scan (no file content read) | file | ✔ | exists: cli/src/main/ts/infrastructure/filesystem/markdown-t |
| `npm test` passes | cmd | ✔ | exit 0 (expected 0) |
| `arch review` passes | cmd | ✔ | exit 0 (expected 0) |

 0) |

## 2026-05-19 15:01:08 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## [AWAITING_REVIEW] TASK-973 [L3-AUTO]
**Closed:** 2026-05-19T16:28:26.641Z
**Title:** formalize the external experiment protocol for ARCH validati

| AC | Type | Pass | Detail |
|---|---|---|---|
| Intent addressed | prose | ✔ | prose: human-verified (non-automated) |
| `arch review` passes | cmd | ✔ | exit 0 (expected 0) |

## 2026-05-19 17:06:22 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-20 06:04:29 — Pattern Alerts
[PATTERN-ALERT] [SpecDrift] detected 8 times — systemic issue. See docs/tensions/

## 2026-05-20 06:04:29 — Alignment Audit
Alignment: 100/100
[EMERGENT] .arch: 64 commits touch this directory but no ADR addresses it.
[EMERGENT] cli: 60 commits touch this directory but no ADR addresses it.
[EMERGENT] docs: 135 commits touch this directory but no ADR addresses it.
