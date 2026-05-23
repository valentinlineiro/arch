## TASK-249: Tighten refinement funnel admission and TTL rules
**Meta:** P1 | S | DONE | Focus:no | 6-writing | claude | docs/refinement/, docs/agents/THINK.md, docs/INBOX.md, arch.config.json
**Closed-at:** 2026-05-18T21:30:00Z

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** The refinement queue grew to 28+ IDEAs because admission required no justification and exit required THINK evaluation. The session-overhead cost was paid on every govern cycle. Implementing an admission gate and TTL policy reduces the surface to 9 executable candidates and one holding file. The gate is enforced in THINK.md text, not in code — enforcement depends on THINK sessions reading and applying the rule.
**Constraint:** TTL enforcement via Sessions counter is a proxy, not a true govern-cycle count. Sessions increments on each THINK invocation, which may not align 1:1 with govern ticks. Overcount risk is low (THINK runs ≤ govern frequency); undercount is possible if THINK sessions are skipped. Acceptable imprecision for a surfacing mechanism.
**Cost:** 2 speculative IDEAs (backlog-compression, protocol-upgrade-policy) migrated to ROADMAP-IDEAS.md, losing individual-file visibility. Operators must check ROADMAP-IDEAS.md to find them. This is the intended trade-off: reduce queue noise at the cost of slightly lower individual discoverability for speculative items.
**Forward Action:** Monitor whether the admission gate in THINK.md text is actually applied in practice over the next 5 THINK sessions. If new speculative IDEAs still appear as individual files, escalate to a code-enforced lint check.
