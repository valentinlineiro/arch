# IDEA: Protocol-as-Code — THINK.md phases that duplicate CLI logic should call the CLI instead
**Created:** 2026-04-30
**Source:** Architectural audit — THINK.md prose for Archival Guard and Flow Guard duplicates govern-system.ts; SSOT violation
**Status:** PROMOTED
**Meta:** P1 | M | local | docs/agents/THINK.md, cli/src/main/ts/application/use-cases/govern-system.ts

## Problem
THINK.md Phase 1 describes in prose exactly what `govern-system.ts` implements in code: Archival Guard (scan for DONE tasks, move to archive, commit), Flow Guard (find highest-priority READY task, set Focus:yes, commit), and Replenishment (count READY tasks, propose IDEA if < 3). Every time the CLI logic changes, the prose becomes stale. Every time an AI agent runs THINK, it re-implements logic that the CLI already executes deterministically — slower, less reliable, and subject to drift.

## Proposed solution
Rewrite THINK.md Phase 1 as a manifesto that delegates to the CLI:

```
## Phase 1: Governance & Replenishment
0. Print: [THINK] Phase 1 — Governance & Replenishment
1. Run: arch govern
   — Archival Guard, Flow Guard, and Replenishment are handled deterministically by the CLI.
   — If arch govern reports a condition requiring AI judgment (e.g. no unblocked READY tasks),
     proceed to Phase 2. Otherwise, Phase 1 is complete.
```

The CLI output becomes the evidence. The AI only intervenes when the CLI escalates. This eliminates the SSOT violation and makes Phase 1 execution faster and drift-proof.

Long term: any THINK phase step that can be expressed as a deterministic CLI command should be. THINK.md becomes the manifest of *what the system does*, not instructions for *how to do it*.

## Dependencies
None — `arch govern` already implements all three guards.

## Estimated size
M

## Gaps
- Verify `arch govern` output is verbose enough to serve as evidence in the THINK terminal report (may need a `--verbose` flag).
- Decide whether THINK.md fully removes the prose descriptions or retains them as collapsed reference (inline comments vs deleted).

## Decision
PROMOTE → TASK-147
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
