# ARCH Compliance Report
Generated: 2026-05-31  Version: 1.2.1

## 1. Governance Rule Inventory (35 ADRs)

| ADR | Title | Status | Enforcement |
|-----|-------|--------|-------------|
| ADR-000-template | ADR-000-template | PROPOSED | documented |
| ADR-001-git-as-operating-system | ADR-001: Use git as the primary state engine | ACCEPTED | documented |
| ADR-002-context-as-budget | ADR-002: Context as a budget, not a default | ACCEPTED | documented |
| ADR-003-dispatch-ephemeral | ADR-003: DISPATCH output is ephemeral — exception  | ACCEPTED | documented |
| ADR-004-flat-tasks-with-focus-field | ADR-004: Flat docs/tasks/ directory with Focus fie | ACCEPTED | documented |
| ADR-005-non-docker-sandbox | ADR-005: Non-Docker Sandbox Strategy | Unknown | documented |
| ADR-006-depends-graph-validation-in-drift-checker | ADR-006: Depends Graph Validation in DriftChecker  | ACCEPTED | documented |
| ADR-007-census-context-budget-check | ADR-007: Census Context Budget Check in DriftCheck | ACCEPTED | documented |
| ADR-008-halt-policy-centralization | ADR-008: Centralize halt conditions in HALT.md | ACCEPTED | documented |
| ADR-009-l3-self-archive | ADR-009: L3 Self-Archive — Audited Autonomous Task | Accepted | documented |
| ADR-010-escalation-maturity | ADR-010: Escalation Maturity Phase 1 (E3 Detectabl | PROPOSED | documented |
| ADR-011-unified-provider-strategies | ADR-011: Unified Provider Strategies | Unknown | documented |
| ADR-012-exec-bridge-layer-bugfixes | ADR-012: Exec/Bridge Layer Bugfixes - maxBuffer, b | Unknown | documented |
| ADR-013-two-tier-drift-detection | ADR-013: Two-Tier Drift Detection Architecture | ACCEPTED | documented |
| ADR-014-causal-graph-schema | ADR-014: Causal Graph Schema for Chronicle | ACCEPTED | cli/src/main/ts/domain/models/causal-relation.ts |
| ADR-015-causal-signal-arbitration | ADR-015: Causal Signal Arbitration Layer | ACCEPTED | documented |
| ADR-016-domain-layer-semantic-boundary | ADR-016: Define the semantic boundary of the domai | ACCEPTED | drift-checker.ts, drift-checker.ts |
| ADR-017-deterministic-observability | ADR-017: Deterministic Observability & Operational | ACCEPTED | documented |
| ADR-018-clean-execution-context | ADR-018: Adversarially Robust Epistemology & Grade | ACCEPTED | documented |
| ADR-019-hansei-ontology | ADR-019: Constitutional Hansei Ontology | PROPOSED | documented |
| ADR-020-focus-sovereignty-model | ADR-020: Focus Sovereignty Model | SUPERSEDED | documented |
| ADR-021-refinement-ttl-and-admission | ADR-021: Refinement funnel TTL and admission gate | ACCEPTED | documented |
| ADR-022-census-budget-recalibration | ADR-022: Census Budget Recalibration for Capture T | Accepted | documented |
| ADR-023-deterministic-gate-invariant | ADR-023: Deterministic Gate Invariant | Unknown | reflect-command.ts, reflect-command.ts |
| ADR-024-drift-coverage-identity-model | ADR-024: Drift Coverage Identity Model | ACCEPTED | documented |
| ADR-025-versioning-architecture | ADR-025: Two-Track Versioning Architecture | ACCEPTED | documented |
| ADR-026-epistemic-layer-separation | ADR-026: Epistemic Layer Separation — Event Log, S | ACCEPTED | documented |
| ADR-027-phase-3-epistemic-stability | ADR-027: Epistemically Bounded Stream Projections  | ACCEPTED | documented |
| ADR-028-epistemic-invariant-specification | ADR-028: Unified Epistemic Invariant Specification | ACCEPTED | cli/src/test/ts/corpus-stress-test.test.ts |
| ADR-029-cli-refactoring | ADR-029: Human-Centric CLI Surface & Command Dispa | Unknown | index.ts, index.ts |
| ADR-030-think-promotion-proposals-domain-model | ADR-030: THINK-generated promotion proposals as a  | Accepted | cli/src/main/ts/domain/models/promotion-proposal.ts |
| ADR-031-sprint-domain-model | ADR-031: Sprint as a first-class domain model | Accepted | cli/src/main/ts/domain/models/sprint.ts, cli/src/main/ts/domain/services/sprint-service.ts |
| ADR-032-automatic-sprint-lifecycle | ADR-032: Automatic sprint lifecycle in arch govern | Accepted | documented |
| ADR-033-protocol-upgrade-policy | ADR-033: Protocol upgrade policy — patch/minor/maj | Accepted | documented |
| ADR-034-govern-reflect-separation | ADR-034: Govern/Reflect Structural Separation | Accepted | grep -n "spawnSync\|execSync" cli/src/main/ts/application/use-cases/govern-system.ts, analyze-command.ts |

## 2. Chronicle Summary

- **Governance rulings:** 155
- **Tasks completed:** 451
- **ANDON halts:** 0
- **Focus transitions:** 0 acquired, 0 preserved

## 3. Enforcement Separation Attestation

**Result:** ✔ PASS
**ADR:** ADR-034 — Govern/Reflect Structural Separation
**Detail:** govern-system.ts contains zero spawnSync/execSync calls — no LLM invocations in governance tick

> This attestation confirms that ARCH governance decisions are made exclusively by
> deterministic code. No LLM output bypasses a governance gate.

## 4. Gap Analysis

- 9 ADR(s) not in Accepted status
