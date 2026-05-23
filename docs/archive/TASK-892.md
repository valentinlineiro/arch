## TASK-892: arch task create - Template-based Acceptance Criteria
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | local | cli/src/main/ts/
**Closed-at:** 2026-05-15T08:32:38.047Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implementation was straightforward. Extended the CLI to also parse the `--class` flag during `task create` to allow explicit template selection before the LLM (which might infer a different class) is called.
**Constraint:** The `TEMPLATE_REGISTRY` is currently hardcoded in the use case. If it grows significantly, it should move to a separate configuration or domain model.
**Cost:** Zero cost.
**Forward Action:** None.
