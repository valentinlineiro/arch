## TASK-220: Automatic entity linking — guidelines↔failures
**Meta:** P1 | M | DONE | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-218

## Approval
Approved-by: Auditor | 2026-05-16

## Hansei
This completes the Phase 1 Feature 3 scope. By linking failures to guidelines, we close the loop on ARCH's institutional memory. The system now doesn't just record what we decided (ADRs) and what we did (Tasks), but also what went wrong (Failures) and how we adapted (Guidelines). This makes guidelines actionable by surfacing them exactly when the operator is entering a known "danger zone" identified by keywords or task references.

## Hansei
Guideline-failure linking completes Phase 1 Feature 3. The deterministic parsing of retros and Kaizen log provides a reliable causal bridge without LLM overhead.
