## TASK-249: Tighten refinement funnel admission and TTL rules
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 6-writing | claude | docs/refinement/, docs/agents/THINK.md, docs/INBOX.md, arch.config.json

### Context

The refinement queue currently holds 28+ IDEAs. Entry is cheap (any speculative idea gets its own IDEA-*.md) and exit is expensive (THINK evaluation + human promotion + archiving). The result is a second backlog that imposes cognitive load on every session without proportional value.

Three rules need to change:
1. **Admission bar**: only executable candidates — ideas with a clear deliverable, scope, and known acceptance shape — get individual IDEA-*.md files. Speculative or exploratory ideas go to a single `ROADMAP-IDEAS.md` holding file.
2. **TTL enforcement**: IDEAs inactive for N govern cycles (suggested: 10) without a Decision field entry are auto-tagged `STALE` and surfaced to INBOX for human adjudication (reject or extend). THINK does not decide; it surfaces.
3. **Lifecycle language**: document the admission criteria and TTL policy in `docs/agents/THINK.md` Phase 1.

### Acceptance Criteria

- [ ] `docs/agents/THINK.md` Phase 1 documents the updated admission criteria: individual IDEA-*.md reserved for executable candidates; speculative ideas route to the roadmap holding file.  →  prose: verified by reading THINK.md Phase 1
- [ ] A `ROADMAP-IDEAS.md` holding file exists in `docs/refinement/` with instructions for how ideas graduate to individual IDEA files.  →  file: docs/refinement/ROADMAP-IDEAS.md
- [ ] TTL policy is defined: IDEAs with no Decision field entry after 10 govern cycles receive a `STALE` tag and an INBOX notification. Policy is documented in THINK.md.  →  prose: verified by reading TTL policy section
- [ ] `arch.config.json` includes a `refinement.ttlCycles` field (default: 10) that THINK reads for staleness evaluation.  →  grep: "ttlCycles" arch.config.json
- [ ] Existing 28+ IDEAs in `docs/refinement/` are triaged: each either retains its individual file (executable candidate) or is migrated to `ROADMAP-IDEAS.md` (speculative).  →  prose: triage complete, verified by counting remaining individual IDEA files

### Definition of Done

- [ ] `arch review` passes with 0 violations after changes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] Refinement queue contains only executable-candidate IDEAs as individual files.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
