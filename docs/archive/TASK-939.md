## TASK-939: Implement correction signal schema and capture points
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude | .arch/, cli/src/main/ts/application/use-cases/escalation-store.ts, cli/src/main/ts/application/commands/task-command.ts
**Closed-at:** 2026-05-19T13:29:06Z

## Hansei
**Severity:** H2
**Category:** [MissingDecisionRecord]
**Decision:** The summary field authorship constraint was resolved by a prompt-or-flag design: `arch task done --redirect` opens an interactive prompt if `--correction` is not provided; `arch govern approve` accepts `--correction "<category>: <summary>"` as an inline flag. The category field is resolved through an alias table (sd=[SpecDrift], etc.) to reduce friction. File refs and ADR refs are extracted deterministically from the task's Context block — no inference.
**Constraint:** The `--redirect` flag on `arch task done` does not actually redirect the task — it only captures a correction signal before the done transition. This is a UX ambiguity: the command name suggests a different action. The intent was to capture "done-but-redirected" corrections at the boundary. This design requires operators to understand the flag is a signal capture, not a status change.
**Cost:** One M session. The correction signal is additive — no existing behavior changes. Operators who omit `--correction` from `arch govern approve` skip signal capture silently. Acceptable for the first implementation.
**Forward Action:** After 20+ correction signals accumulate, evaluate clustering quality via THINK. See IDEA-corpus-informed-reprioritization for the aggregation model. If categories are too coarse, refine the vocabulary or add sub-categories.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
