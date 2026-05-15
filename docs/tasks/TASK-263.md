## TASK-263: DaaS Vision — implement arch explain command (Feature 5)
**Meta:** P2 | S | READY | Focus:no | 2-code-generation | claude | docs/refinement/, cli/src/main/ts/

### Context

The Discipline as a Service (DaaS) vision defined five features to reduce ARCH ceremony. Features 1–4 are complete. Feature 5, `arch explain`, provides on-demand glossary and ontology help so users can look up ARCH concepts without reading the full protocol docs. This task implements the remaining DaaS scope.

### Acceptance Criteria

- [ ] `arch explain <term>` returns a concise definition and usage context for ARCH ontology terms (e.g., Hansei, Focus, DriftChecker, READY).
- [ ] The command covers at least the 20 most-used ARCH terms drawn from docs/guidelines/ and docs/adr/.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

### Definition of Done

- [ ] `arch explain` command implemented and terms dictionary populated.
- [ ] `arch review` passes.
