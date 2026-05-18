## TASK-249: Tighten refinement funnel admission and TTL rules
**Meta:** P1 | S | REVIEW | Focus:yes | 6-writing | claude | docs/refinement/, docs/agents/THINK.md, docs/INBOX.md, arch.config.json
**ADR:** ADR-021

### Context

The refinement queue currently holds 28+ IDEAs. Entry is cheap (any speculative idea gets its own IDEA-*.md) and exit is expensive (THINK evaluation + human promotion + archiving). The result is a second backlog that imposes cognitive load on every session without proportional value.

Three rules need to change:
1. **Admission bar**: only executable candidates — ideas with a clear deliverable, scope, and known acceptance shape — get individual IDEA-*.md files. Speculative or exploratory ideas go to a single `ROADMAP-IDEAS.md` holding file.
2. **TTL enforcement**: IDEAs inactive for N govern cycles (suggested: 10) without a Decision field entry are auto-tagged `STALE` and surfaced to INBOX for human adjudication (reject or extend). THINK does not decide; it surfaces.
3. **Lifecycle language**: document the admission criteria and TTL policy in `docs/agents/THINK.md` Phase 1.

### Acceptance Criteria

- [x] `docs/agents/THINK.md` Phase 1 documents the updated admission criteria: individual IDEA-*.md reserved for executable candidates; speculative ideas route to the roadmap holding file.  →  prose: Steps 3a-3b added to THINK.md Phase 1. Step 3a defines executable candidate gate; step 3b defines TTL enforcement using ttlCycles. Verified in THINK.md Phase 1.
- [x] A `ROADMAP-IDEAS.md` holding file exists in `docs/refinement/` with instructions for how ideas graduate to individual IDEA files.  →  file: docs/refinement/ROADMAP-IDEAS.md
- [x] TTL policy is defined: IDEAs with no Decision field entry after 10 govern cycles receive a `STALE` tag and an INBOX notification. Policy is documented in THINK.md.  →  prose: THINK.md step 3b: Sessions ≥ ttlCycles + empty Decision → STALE tag + INBOX notification. THINK surfaces, does not decide.
- [x] `arch.config.json` includes a `refinement.ttlCycles` field (default: 10) that THINK reads for staleness evaluation.  →  grep: "ttlCycles": 10 present in arch.config.json refinement block.
- [x] Existing 28+ IDEAs in `docs/refinement/` are triaged: each either retains its individual file (executable candidate) or is migrated to `ROADMAP-IDEAS.md` (speculative).  →  prose: 25 IDEAs triaged: 13 archived (already promoted), 2 migrated to ROADMAP-IDEAS.md (backlog-compression, protocol-upgrade-policy — no known acceptance shape), 9 kept as individual executable candidates, 1 ROADMAP-IDEAS.md created.

### Definition of Done

- [x] `arch review` passes with 0 violations after changes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [x] Refinement queue contains only executable-candidate IDEAs as individual files.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The refinement queue grew to 28+ IDEAs because admission required no justification and exit required THINK evaluation. The session-overhead cost was paid on every govern cycle. Implementing an admission gate and TTL policy reduces the surface to 9 executable candidates and one holding file. The gate is enforced in THINK.md text, not in code — enforcement depends on THINK sessions reading and applying the rule.
**Constraint:** TTL enforcement via Sessions counter is a proxy, not a true govern-cycle count. Sessions increments on each THINK invocation, which may not align 1:1 with govern ticks. Overcount risk is low (THINK runs ≤ govern frequency); undercount is possible if THINK sessions are skipped. Acceptable imprecision for a surfacing mechanism.
**Cost:** 2 speculative IDEAs (backlog-compression, protocol-upgrade-policy) migrated to ROADMAP-IDEAS.md, losing individual-file visibility. Operators must check ROADMAP-IDEAS.md to find them. This is the intended trade-off: reduce queue noise at the cost of slightly lower individual discoverability for speculative items.
**Forward Action:** Monitor whether the admission gate in THINK.md text is actually applied in practice over the next 5 THINK sessions. If new speculative IDEAs still appear as individual files, escalate to a code-enforced lint check.
