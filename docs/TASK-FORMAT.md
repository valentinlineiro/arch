# TASK-FORMAT v0.6.0
<!-- Canonical specification for ARCH tasks -->
<!-- Compatible with ARCH v0.6 and later — supersedes v0.5 -->
<!-- Decision basis: ADR-004 (flat docs/tasks/ + Focus field) + TASK-129 (Remove Value field) -->

## Overview
ARCH v0.6 simplifies the Meta line by removing the `Value` field, prioritizing Priority and Size as the primary metrics for backlog ordering.

---

## The Block Structure

```markdown
## TASK-ID: Title
**Meta:** P[0-3] | [Size] | [STATUS] | Focus:yes/no | [Class] | [CLI] | [Context]
**Sprint:** sprint/<slug>  (optional)
**Depends:** TASK-ID, TASK-ID... (optional)

### Acceptance Criteria
- [ ] AC 1
- [ ] AC 2

### Definition of Done
- [ ] DoD 1
```

---

## Fields

### 1. TASK-ID
- Format: `TASK-XXX` (e.g., `TASK-064`)
- Unique across the full project history (tasks + archive).

### 2. Title
- Clear, descriptive name of the goal. English only.

### 3. Meta Line (Compressed)
The meta line is the source of truth for task state and routing. It MUST be a single line.

- **Priority:** `P0` (Critical/Blocker) to `P3` (Nice to have).
- **Size:** `XS`, `S`, `M`, `L`, `XL` (XL must be decomposed before execution).
- **Status:** See [Status Vocabulary](#status-vocabulary).
- **Focus:** `Focus:yes` (active queue — agent picks this session) or `Focus:no` (queued — visible for planning).
- **Class:** ID-slug (e.g., `2-code-generation`, `6-writing`, `7-operations`).
- **CLI:** Target agent mode (e.g., `local`, `claude`, `human`).
- **Context:** Comma-separated list of files or globs relevant to the task.

### 4. Sprint (optional)
- A sprint is a named, scope-based collection of tasks — not time-boxed.
- Format: `**Sprint:** sprint/<slug>` (e.g., `sprint/review-hardening`, `sprint/control-panel`)
- Naming convention: `sprint/` prefix + lowercase hyphenated slug describing the theme.
- Tasks without this line are not assigned to any sprint.
- The active sprint is tracked in `arch.config.json` under `currentSprint`.
- **Closing a sprint:** See `docs/agents/DO.md` → Intent: Sprint Close for the full close sequence (verify all tasks DONE → generate summary in METRICS.md → clear `currentSprint`).

### 5. Depends
- Optional line listing blocking TASK-IDs.
- Format: `**Depends:** TASK-XYZ, TASK-ABC`

### 6. Acceptance Criteria (AC)
- Atomic, verifiable checkboxes.
- All must be checked before marking the task `REVIEW` or `DONE`.

### 7. Definition of Done (DoD)
- Project-level quality standards (e.g., "PR approved", "`arch review` passes").
- Optional for `XS` tasks if global guidelines cover them.

---

## Status Vocabulary

| Status | Location | Meaning |
|--------|----------|---------|
| `READY` | `docs/tasks/` | Defined and estimated, waiting for execution. |
| `IN_PROGRESS` | `docs/tasks/` | Currently locked by an agent or human. |
| `REVIEW` | `docs/tasks/` | Implementation finished, pending human/PR review. |
| `DONE` | `docs/archive/` | Completed and verified. |
| `BLOCKED` | `docs/tasks/` | Stopped due to ambiguity or missing dependency. |
| `REJECTED` | `docs/archive/` | Cancelled or superseded. |

---

## Definition of Ready (DoR)

A task must meet the following criteria before its status can be set to `READY`:

1. **Clear Title:** The title is descriptive and written in English (no non-ASCII characters).
2. **Acceptance Criteria:** At least one verifiable AC is defined.
3. **Estimated Size:** Size is assigned (`XS` to `L`). `XL` tasks must be decomposed first.
4. **Unblocked:** All `**Depends:**` references are resolved or none exist.
5. **Focus Off:** Set to `Focus:no` by default (Flow Guard or human will set to `yes`).
6. **Nemawashi Gate (M+):** Tasks sized `M` or larger must have a `## Gaps` section filled (by THINK or human) to ensure alignment on approach before implementation begins.

> **Note:** `READY` is the gate for autonomous execution. Underspecified tasks should remain as draft IDEAs or be marked `BLOCKED`.

---

## Rules of Engagement

### Header & Title
```
^## TASK-(?<id>\d{3}): (?<title>.+)$
```

### Meta Line
```
^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>XS|S|M|L|XL) \| (?<status>IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED) \| (?<focus>Focus:yes|Focus:no) \| (?<class>\d-[a-z-]+) \| (?<cli>[a-z-]+) \| (?<context>.+)$
```

This regex is authoritative. The CLI validator (`cli/src/main/ts/domain/services/task-validator.ts`) implements this pattern.

---

## Rules of Engagement

1. **One task, one file:** each task is its own file in `docs/tasks/`. No inline lists, no monolithic files.
2. **Atomic status:** a task exists in exactly one location. Active tasks → `docs/tasks/`. Archived tasks → `docs/archive/`. No duplicates.
3. **Focus as intent:** the agent reads `Focus:yes` tasks as the active queue per session. Switching focus is a one-field edit — not a file move.
4. **No drift:** changes to AC/DoD during `IN_PROGRESS` are allowed but must be committed immediately.
5. **Lock on start:** when picking up a task, set status to `IN_PROGRESS` and `Focus:yes`, commit before implementation begins.

---

## Example

### v0.6 (Canonical)
```markdown
## TASK-064: Sync TASK-FORMAT.md with Focus-based model
**Meta:** P1 | M | IN_PROGRESS | Focus:yes | 6-writing | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/, docs/guidelines/

### Acceptance Criteria
- [ ] Rewrite `docs/TASK-FORMAT.md` to define the Focus-based schema (ADR-004) as canonical.
- [ ] Update the meta line regex to include `Focus:yes/no`.
- [ ] Deprecate/Remove Sprint/Backlog terminology from the specification.
- [ ] Ensure all examples use the current v0.6 format.

### Definition of Done
- [ ] `docs/TASK-FORMAT.md` matches the implementation in the CLI validator.
- [ ] Documentation is consistent with ADR-004.
```

---

## Migration Guide (v0.5 → v0.6)

Remove the `Value` field (1-10) after `Size`:

### v0.5 (Legacy)
```markdown
**Meta:** P0 | S | 5 | READY | Focus:no | 6-writing | local | agents/EXEC.md, docs/GUIDELINES.md
```

### v0.6 (Canonical)
```markdown
**Meta:** P0 | S | READY | Focus:no | 6-writing | local | agents/EXEC.md, docs/GUIDELINES.md
```

**Semver impact:** MINOR. Removed a field. Existing tasks require migration.
