# IDEA: Structural policies — machine-enforced architectural boundaries in arch review
**Created:** 2026-05-08
**Source:** Roadmap reflection
**Status:** DEFERRED
**Meta:** P2 | M | claude-code | cli/src/main/ts/domain/services/drift-checker.ts, arch.config.json

## Problem
Architectural constraints (forbidden dependencies, naming conventions, mandatory tests for core modules, module boundary rules) are stated in guidelines but not enforced. A convention that can be skipped under velocity pressure will be skipped. Guidelines alone are not governance.

## Proposed solution
Define structural policies in `arch.config.json` as declarative rules checked by `arch review`:

```json
"policies": {
  "forbiddenDependencies": [
    { "from": "domain/", "to": "infrastructure/", "reason": "domain must not depend on infra" }
  ],
  "requiredTestCoverage": [
    { "path": "domain/services/", "requiresTest": true }
  ],
  "namingInvariants": [
    { "pattern": "domain/models/*.ts", "mustMatch": "^[a-z-]+\\.ts$" }
  ],
  "adrRequiredFor": ["domain/services/", "arch.config.json"]
}
```

Each policy violation is a `arch review` WARN or ERR, with the same severity semantics as existing drift checks.

## Rationale
P-003 states: "Any intended gate must produce a non-zero exit from arch review or a pre-commit hook. A gate enforced only by convention will eventually be skipped under velocity pressure." Structural policies extend this principle from task format to architectural integrity. This is the difference between ARCH as a workflow tool and ARCH as a governance layer.

## Related IDEAs
- [IDEA-formal-protocol-invariants.md](IDEA-formal-protocol-invariants.md) — closely related; machine-provable guarantees

## Dependencies
ADR-013 (two-tier drift detection framework).

## Estimated size
M

## Gaps

## Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites (signal corpus, arch ask compounding).

### Decision
DEFERRED: Valid long-term direction. Gated on Phase C/D prerequisites (signal corpus, arch ask compounding). Re-evaluate when READY count drops below 5 or Phase B reaches 50%.
