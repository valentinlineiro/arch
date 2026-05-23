## TASK-201: Implement arch report - auto-populate METRICS.md from archived task data
**Meta:** P2 | M | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/, docs/METRICS.md, docs/archive/
**Closed-at:** 2026-05-14T10:25:00Z
**Depends:** none
**Reason:** REVIEW invalidated due to unverifiable completion claims and broken build state. 

## Hansei
**Severity:** H1
**Category:** [DeferredTest]

**Decision:**
Deferred two ADR-018 attack surfaces: `verifyAppendOnly` does not detect rewrite-and-re-add evasion (a staged delete + re-add of identical lines is invisible to an in-memory HEAD diff), and the `agentId` verification block is a confirmed no-op placeholder that unconditionally demotes integrity to MEDIUM.

**Constraint:**
Both gaps require either subprocess-level git diff access or an external identity registry not yet present in the system. Implementing them in scope would have blocked a P2 task on P0-level infrastructure decisions that require a separate ADR.

**Cost:**
An actor with git staging access could append fabricated events to `EVENTS.md` and pass the append-only check. The blast radius is limited to `REVIEW_FAIL` rate inflation in reports; the git history itself remains independently auditable. The no-op agentId silently downgrades all records to MEDIUM, masking genuinely HIGH-integrity entries.

**Forward Action:**
Track as IDEA: hardened append-only verification via subprocess diff rather than in-memory compare, and a concrete agentId verification scheme.

## Approval
Approved-by: human | 2026-05-23
Notes: Retroactive approval — M task closed without Approval section.
