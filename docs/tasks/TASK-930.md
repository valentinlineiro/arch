## TASK-930: Remove machine reads of INBOX.md from loop-engine and next-command
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude | cli/src/main/ts/application/use-cases/loop-engine.ts, cli/src/main/ts/application/commands/next-command.ts, docs/agents/DO.md

### Context

Promoted from IDEA-inbox-invariant-contradiction (TASK-927 audit, finding 1).

Human decision: INBOX is write-only for automation. Machine control signals move to `.arch/` structured state. The two code reads are bugs to remove or relocate, not exceptions to bless.

**Current violations:**
- `loop-engine.ts:350`: reads INBOX to detect `SPRINT_CHECKPOINT` markers → move signal to `.arch/escalations.jsonl` or a new `.arch/sprint-state.json`
- `next-command.ts:66`: reads INBOX to check freshness → remove or redirect to a structured source
- `docs/agents/DO.md:29`: tells an Auditor session to read INBOX → update to match invariant

**Not in scope:** The git sync policy contradiction (AGENTS.md:139 vs DO.md:7) is bundled in IDEA-inbox-invariant-contradiction but has not yet been decided. TASK-930 covers only the code reads.

### Acceptance Criteria

- [ ] `loop-engine.ts` does not read `docs/INBOX.md` for any control signal. Sprint checkpoint detection uses a structured store.
- [ ] `next-command.ts` does not read `docs/INBOX.md` for freshness.
- [ ] `docs/agents/DO.md` does not instruct agents to read INBOX.
- [ ] `arch review` passes after changes.
- [ ] Existing `arch loop` and `arch next` behavior is preserved (sprint resumption still works, freshness check still enforced if applicable).

### Definition of Done
- [ ] Tests pass.
- [ ] `arch review` passes.

## Hansei

**Severity:** H1
**Category:** [SpecDrift]
**Decision:** Placeholder — to be filled at close.
**Constraint:** Placeholder — to be filled at close.
**Cost:** Placeholder — to be filled at close.
**Forward Action:** Placeholder — to be filled at close.
