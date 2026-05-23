## TASK-946: 1.0.0 release: fix reflect modePreamble bug, collapse context feedback, Metrics Narrowing, version bump
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/reflect-command.ts, cli/src/main/ts/application/use-cases/context-inference.ts, cli/package.json, docs/ROADMAP.md
**Closed-at:** 2026-05-18T15:01:00.519Z
**Depends:** none

## Hansei
**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Two latent bugs surfaced during release work: (1) `modePreamble` was referenced in `reflect-command.ts` but never defined — caused `arch reflect` to throw a ReferenceError on any real invocation. (2) Census budget of 1000 was stale; arch-capture template expansions had pushed docs/tasks/ to 1250+ lines, causing a permanent Census warning. Both fixed in-band. Metrics Narrowing changed from a confidence-threshold guard (`< 0.1`) to an empty-result guard (`files.length === 0 && adrs.length === 0`) after tests revealed the threshold was too aggressive for sparse fixtures.
**Constraint:** Neither bug was caught by the existing test suite — both were reachable via normal CLI paths. The confidence threshold change required updating the guard condition and three test assertions.
**Cost:** One extra cycle to identify the Census staleness root cause (required ADR-022). Test assertion updates for the feedback section collapse added minor rework.
**Forward Action:** None required.

## Approval
Approved-by: valentinlineiro | 2026-05-19
