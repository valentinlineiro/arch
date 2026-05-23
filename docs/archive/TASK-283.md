## TASK-283: Define Sentinel call log infrastructure and CLI command
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude | cli/src/main/ts/, docs/agents/DO.md
**Closed-at:** 2026-05-19T13:29:06Z

## Hansei
**Severity:** H2
**Category:** [SpecDrift]
**Decision:** The `SentinelCoverage` check uses task size (M/L/XL) as the cost proxy because that is the only durable, structured field available at review time without requiring DO.md protocol adherence to be tracked separately. The check is advisory (WARN not FAIL) — making it a gate would block legitimate IN_PROGRESS tasks that started before this feature was deployed, since they have no retroactive sentinel entries.
**Constraint:** Size as cost proxy is imperfect. A well-scoped M task may have lower risk than a poorly-scoped S task. The check catches the structural case (large tasks should have explicit preflight reasoning) but cannot enforce the quality of the reasoning recorded. A HALT entry is structurally equivalent to a GO entry from the check's perspective — the human must read the log to judge.
**Cost:** One M session. Implementation is straightforward; the sentinel log is a markdown file rather than a jsonl to keep it human-readable and auditable without tooling.
**Forward Action:** See IDEA-corpus-informed-reprioritization for patterns on advisory-layer design. After 60 days, audit whether Sentinel entries show a non-trivial HALT rate. If HALT rate is > 10%, the check is surfacing real preflight decisions. If it is < 1%, the log is ceremonial and the check's threshold should be tightened to L/XL only.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
