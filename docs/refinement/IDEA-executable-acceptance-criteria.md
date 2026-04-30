# IDEA: Executable acceptance criteria — structured ACs verifiable without an AI pass
**Created:** 2026-04-30
**Source:** Strategic vision — prose ACs are self-assessed by the executor; structured ACs can be verified deterministically
**Status:** DRAFT
**Meta:** P1 | L | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/DO.md

## Problem
Acceptance Criteria are prose statements assessed by the same agent that implemented the task. The Auditor pattern (TASK-142) addresses the conflict of interest, but still requires AI judgment to evaluate "did this AC pass?" For ACs that are objectively verifiable (file exists, command returns exit 0, pattern found in file), requiring an AI to assess them is slower, more expensive, and less reliable than a deterministic check.

## Proposed solution
Introduce a structured AC format alongside the existing prose format. Structured ACs use a simple predicate syntax:

```
- [ ] `arch review` passes  →  cmd: arch review; exit: 0
- [ ] Task file exists      →  file: docs/tasks/TASK-XXX.md
- [ ] Meta status is READY  →  grep: "READY" docs/tasks/TASK-XXX.md
```

The `arch validate --acs TASK-XXX` command runs all structured ACs deterministically and reports pass/fail per AC. Prose ACs (requiring judgment) remain and are still assessed by the Auditor. The mix is valid: some ACs are machine-checked, others are AI-assessed.

Long term: the ratio of structured to prose ACs per task becomes a quality metric. Tasks with 100% structured ACs can skip the Auditor entirely.

## Dependencies
TASK-142 (Auditor role — structured ACs reduce but don't eliminate the need for it).
IDEA-typed-protocol-schema (structured ACs are a subset of a typed protocol).

## Estimated size
L — must be decomposed before entering READY.

## Gaps
- Define the predicate syntax precisely — must be readable by humans and parseable by the CLI.
- Decide whether structured ACs are opt-in per task or required above a certain size threshold.
- Handle ACs that are only verifiable after deployment (e.g. "feature works in production").

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
