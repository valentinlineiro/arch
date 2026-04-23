# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- One draft at a time. Promote or reject before adding next. -->

## Current draft

**Status:** DRAFT
**Proposed by:** Valen
**Date:** 2026-04-23
**Source:** Bootstrap session — observed during ARCH self-setup

### Proposal
ARCH needs a REVIEWER agent. When a PR is opened by an EXEC agent,
there's no protocol for AI-assisted review before the human sees it.
The human currently gets the raw output without a first pass.
A REVIEWER agent would run against the PR diff and AC checklist
before the human review — catching obvious misses early.

### Gaps identified by AI
<!-- To be filled by REFINE agent -->
- [ ] What's the exact trigger? Post-push hook, manual invocation, or CI step?
- [ ] Does REVIEWER have write access to add PR comments, or does it write to a file?
- [ ] What's the context-budget? PR diff can be large — need a size limit.
- [ ] Is this PATCH (improves existing EXEC flow) or MINOR (new agent)?
- [ ] What does "obvious miss" mean concretely — AC not checked? DoD incomplete? Scope creep?

### Kaizen suggestions
<!-- To be filled by REFINE agent after first real retro -->
_Insufficient history — first sprint not yet closed._

### Human decision
_Pending refinement_

---

## Refinement history

| Date | Title | Outcome |
|------|-------|---------|
| — | — | — |
