# TASK-FORMAT v0.5.0
<!-- Canonical specification for ARCH tasks -->
<!-- Compatible with ARCH v0.5 and later — supersedes v0.4 -->
<!-- Decision basis: ADR-004 (flat docs/tasks/ + Focus field) + TASK-108 (Value field) -->

## Overview
ARCH v0.5 introduces a mandatory `Value` field in the Meta line to enable dynamic backlog reprioritization based on value-to-size ratio.

---

## The Block Structure

```markdown
## TASK-ID: Title
**Meta:** P[0-3] | [Size] | [Value] | [STATUS] | Focus:yes/no | [Class] | [CLI] | [Context]
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
- **Value:** `1` (Low impact) to `10` (High impact/Critical value).
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

> **Note:** `IDEA` is not a task status — ideas live as draft files in `docs/refinement/` and are promoted to tasks via explicit human instruction.

---

## Canonical Regex (PCRE)

### Header & Title
```
^## TASK-(?<id>\d{3}): (?<title>.+)$
```

### Meta Line
```
^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>XS|S|M|L|XL) \| (?<value>10|[1-9]) \| (?<status>IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED) \| (?<focus>Focus:yes|Focus:no) \| (?<class>\d-[a-z-]+) \| (?<cli>[a-z-]+) \| (?<context>.+)$
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

### v0.5 (Canonical)
```markdown
## TASK-064: Sync TASK-FORMAT.md with Focus-based model
**Meta:** P1 | M | 8 | IN_PROGRESS | Focus:yes | 6-writing | local | docs/TASK-FORMAT.md, cli/src/, docs/agents/, docs/guidelines/

### Acceptance Criteria
- [ ] Rewrite `docs/TASK-FORMAT.md` to define the Focus-based schema (ADR-004) as canonical.
- [ ] Update the meta line regex to include `Focus:yes/no`.
- [ ] Deprecate/Remove Sprint/Backlog terminology from the specification.
- [ ] Ensure all examples use the current v0.5 format.

### Definition of Done
- [ ] `docs/TASK-FORMAT.md` matches the implementation in the CLI validator.
- [ ] Documentation is consistent with ADR-004.
```

---

## Migration Guide (v0.4 → v0.5)

Inject a `Value` field (1-10) after `Size`:

### v0.4 (Legacy)
```markdown
**Meta:** P0 | S | READY | Focus:no | 6-writing | local | agents/EXEC.md, docs/GUIDELINES.md
```

### v0.5 (Canonical)
```markdown
**Meta:** P0 | S | 5 | READY | Focus:no | 6-writing | local | agents/EXEC.md, docs/GUIDELINES.md
```

**Semver impact:** MINOR. Added a mandatory field. Existing tasks require migration.
