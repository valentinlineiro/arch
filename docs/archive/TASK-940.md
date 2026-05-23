## TASK-940: Implement semantic collision detection - AC-vs-ADR conflict advisory at capture/start
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/application/commands/capture-command.ts, cli/src/main/ts/application/commands/task-command.ts, docs/adr/
**Closed-at:** 2026-05-19T13:29:06Z

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** The negation vocabulary (13 patterns seeded from actual ADR constraint language) and the stop-word list (40 common words plus ARCH-specific noise terms) were derived empirically from the repo's ADRs rather than assumed. The ≥3-term threshold is intentionally conservative — it will miss narrow conflicts but avoids false-positive noise that trains operators to dismiss the advisory. The advisory-only design is the load-bearing invariant: this is a signal layer, not a gate.
**Constraint:** Token overlap remains a proxy for semantic conflict. Two ACs can share 5+ terms with an ADR while being architecturally compatible (e.g., implementing the same system in a compliant way). The system cannot distinguish compliance from contradiction without semantic reasoning. Operators must read the advisory and judge. This limitation is explicit and accepted by design.
**Cost:** Each capture and task-start now reads all ACCEPTED ADR files (~24 files, ~50KB total). Negligible at current scale. At 100+ ADRs a pre-computed term index would be warranted. Deferred.
**Forward Action:** After 30 days of operation, check dismissed-annotation count vs total advisory emissions. If dismissal rate exceeds 30%, raise the term threshold from 3 to 4 or narrow the negation vocabulary. See IDEA-corpus-informed-reprioritization for related advisory-layer design patterns.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
