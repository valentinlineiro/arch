# IDEA: Executable acceptance criteria — structured ACs verifiable without an AI pass
**Created:** 2026-04-30
**Source:** Strategic vision — prose ACs are self-assessed by the executor; structured ACs can be verified deterministically
**Status:** DRAFT
**Meta:** P1 | M | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/DO.md

## Problem
Acceptance Criteria are prose statements assessed by the same agent that implemented the task. The Auditor pattern (TASK-142) addresses the conflict of interest, but still requires AI judgment to evaluate "did this AC pass?" For ACs that are objectively verifiable (file exists, command returns exit 0, pattern found in file), requiring an AI to assess them is slower, more expensive, and less reliable than a deterministic check.

## Proposed solution
**Core already implemented:** `arch validate --acs TASK-XXX` and `cmd:` predicates are fully built. Remaining work extends the existing foundation.

Predicate syntax (extended):
```
- [ ] `arch review` passes  →  cmd: arch review; exit: 0
- [ ] Task file exists      →  file: docs/tasks/TASK-XXX.md
- [ ] Meta status is READY  →  grep: "READY" docs/tasks/TASK-XXX.md
- [ ] Feature works in prod →  prose: verified manually post-deployment
```

**Rules:**
- Every AC must have a predicate (`cmd:`, `file:`, `grep:`) or be explicitly marked `prose:`. No bare prose ACs.
- `prose:` marks an AC as judgment-only, exempt from machine verification. Use sparingly.
- Tasks with zero `prose:` ACs skip the Auditor entirely — machine verification is sufficient.
- Tasks with any `prose:` ACs still require the Auditor for those ACs only.

## Dependencies
TASK-142 (Auditor role — structured ACs reduce but don't eliminate the need for it).
IDEA-typed-protocol-schema (structured ACs are a subset of a typed protocol).

## Estimated size
M — `cmd:` and `arch validate --acs` already exist; remaining work is `file:`/`grep:`/`prose:` parser extensions, enforcement in `arch task review`, Auditor bypass logic, and TASK-FORMAT.md update.

## Gaps
All resolved:
- **Predicate syntax:** `cmd:` (existing), `file:`, `grep:` (new sugar), `prose:` (exemption marker).
- **Enforcement:** Required on all ACs — every AC needs a predicate or `prose:` marker.
- **Post-deployment ACs:** `prose:` tag, used sparingly.
- **Auditor bypass:** Enabled automatically when zero `prose:` ACs on a task.

## Decision
PROMOTE → TASK-205
