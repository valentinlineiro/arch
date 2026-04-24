# TASK-FORMAT v0.2
<!-- Canonical specification for ARCH tasks -->
<!-- Compatible with ARCH v0.2 and later -->

## Overview
ARCH v0.2 simplifies the task structure from 8+ header fields to a compressed 3-line format. This reduces token usage and improves parsing consistency across different AI agents.

---

## The Block Structure

```markdown
## TASK-ID: Title
**Meta:** P[0-3] | [Size] | [STATUS] | [Sprint N] | [Class] | [CLI] | [Context]
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
- Format: `TASK-XXX` (e.g., `TASK-024`)
- Unique identifier within the project history.

### 2. Title
- Clear, descriptive name of the goal.

### 3. Meta Line (Compressed)
The meta line is the source of truth for task state and routing. It MUST be a single line.

- **Priority:** `P0` (Critical/Blocker) to `P3` (Nice to have).
- **Size:** `XS`, `S`, `M`, `L`, `XL` (XL must be decomposed).
- **Status:** See [Status Vocabulary](#status-vocabulary).
- **Sprint:** `Sprint N` or `Backlog`.
- **Class:** ID-slug (e.g., `2-code-generation`, `6-writing`).
- **CLI:** Target agent mode (e.g., `claude`, `human`, `claude-code`).
- **Context:** Comma-separated list of files or globs required for the task.

### 4. Depends
- Optional line listing blocking TASK-IDs.

### 5. Acceptance Criteria (AC)
- Atomic, verifiable checkboxes.
- Must be all checked before marking as `REVIEW` or `DONE`.

### 6. Definition of Done (DoD)
- Project-level quality standards (e.g., "PR approved", "CI green").
- Optional for `XS` and `S` tasks if they follow global guidelines.

---

## Status Vocabulary

| Status | Location | Meaning |
|--------|----------|---------|
| `IDEA` | `BACKLOG.md` only | Draft proposal, not yet ready for selection. |
| `READY` | `SPRINT.md` / `BACKLOG.md` | Defined and estimated, waiting for execution. |
| `IN_PROGRESS` | `SPRINT.md` | Currently locked by an agent or human. |
| `REVIEW` | `SPRINT.md` | Implementation finished, pending human/PR review. |
| `DONE` | `SPRINT.md` / `DONE.md` | Completed and verified. |
| `BLOCKED` | Any | Stopped due to ambiguity or missing dependency. |
| `REJECTED` | Any | Cancelled or superseded. |

---

## Canonical Regex (PCRE)

### Header & Title
`^## TASK-(?<id>\d{3}): (?<title>.+)$`

### Meta Line
`^\*\*Meta:\*\* P(?<priority>[0-3]) \| (?<size>XS|S|M|L|XL) \| (?<status>IDEA|READY|IN_PROGRESS|REVIEW|DONE|BLOCKED|REJECTED) \| (?<sprint>Sprint \d+|Backlog) \| (?<class>\d-[a-z-]+) \| (?<cli>[a-z-]+) \| (?<context>.+)$`

---

## Rules of Engagement

1. **IDEA Promotion:** An `IDEA` remains in `BACKLOG.md`. It can only be promoted to `READY` after a `THINK` session or explicit human instruction.
2. **Atomic Status:** A task exists in ONLY ONE state. When moving from `BACKLOG.md` to `SPRINT.md`, the entry in `BACKLOG.md` must be removed or marked as moved.
3. **No Drift:** Changes to task structure (AC/DoD) during `IN_PROGRESS` are allowed but must be committed immediately.

---

## Migration Example

### v0.1 (Legacy)
```markdown
## TASK-024: Spec formato canónico de tarea v0.2 + regex
**Meta:** P0 | S | READY | Sprint 1
**Class:** 6-writing
**CLI:** claude
**CLI-reason:** spec formal...
**Context-budget:** agents/EXEC.md + this task + docs/GUIDELINES.md
**Depends:** TASK-023
```

### v0.2 (Canonical)
```markdown
## TASK-024: Spec formato canónico de tarea v0.2 + regex
**Meta:** P0 | S | READY | Sprint 1 | 6-writing | claude | agents/EXEC.md, docs/GUIDELINES.md
**Depends:** TASK-023
```

---

## Semver Impact
- **Impact:** MAJOR
- **Rationale:** Breaks existing parsers in `arch-init` and agent protocols.
- **Migration:** All active tasks must be converted to the new format before upgrading to ARCH v0.2.
