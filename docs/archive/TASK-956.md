## TASK-956: Implement two-track versioning architecture
**Meta:** P1 | M | DONE | Focus:no | 2-code-generation | claude | arch.config.json, cli/package.json, cli/src/main/ts/application/use-cases/drift-checker.ts, docs/PROTOCOL.md, docs/guidelines/versioning.md
**Closed-at:** 2026-05-20T12:46:07Z
**Depends:** none

## Hansei
**Severity:** H0
**Category:** [SpecDrift]
**Decision:** Implementation proceeded cleanly against spec. No blockers, scope additions, or invariant violations encountered. ADR-025 was written before modifying the protected path arch.config.json, satisfying the protection constraint.
**Constraint:** arch.config.json is a protected path requiring a preceding ADR before modification. This constraint was respected by authoring ADR-025 first.
**Cost:** One extra commit for ADR-025 before the config change, which is the correct sequence.
**Forward Action:** No forward action required. VersionCompat is now enforced by arch review on every commit.

## Approval
Approved-by: human-auditor | 2026-05-20
