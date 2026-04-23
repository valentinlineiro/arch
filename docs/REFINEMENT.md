# REFINEMENT.md
<!-- Ideas being refined before entering BACKLOG -->
<!-- One draft at a time. Promote or reject before adding next. -->

## Current draft

### DISPATCH.md staleness — rule to keep it fresh

**Problem:** DISPATCH.md accumulates stale entries between CONDUCTOR runs. Agents and humans act on outdated priorities because nothing enforces freshness.

**Idea:** Define an explicit rule (or set of rules) that prevents DISPATCH.md from being treated as current after a given threshold — whether via a TTL field, a mandatory CONDUCTOR trigger on sprint events, or a staleness warning protocol.

**Open questions for REFINE:**
- What triggers CONDUCTOR today? Only explicit human invocation?
- Should DISPATCH.md have a `Generated-at:` timestamp that other agents check?
- Should HUMAN.md warn the user if DISPATCH.md is older than X hours before acting?
- Is TASK-015 (auto-commit DISPATCH on CONDUCTOR run) sufficient, or is the root problem infrequent CONDUCTOR runs?

**Draft date:** 2026-04-23

---

## Refinement history

| Date | Title | Outcome |
|------|-------|---------|
| 2026-04-23 | Mandatory EXEC Commits before REVIEW | Promoted to TASK-016 (BACKLOG) |
| 2026-04-23 | REVIEWER agent protocol | Promoted to TASK-012 (BACKLOG) |
| 2026-04-23 | HUMAN agent dual-file sync on sprint move | Promoted to TASK-013 (BACKLOG) |
