# TASK-FORMAT v1.0.0
<!-- Canonical specification for ARCH tasks -->
<!-- Compatible with ARCH v1.0 and later — supersedes v0.5 -->
<!-- Decision basis: ADR-004 (flat docs/tasks/ + Focus field) + TASK-129 (Remove Value field) -->


## Machine-Readable Schema

The following values are enforced by `DriftChecker.checkTaskTemplateCompliance()` on all READY and REVIEW tasks:

| Field | Position | Valid Values | Required |
|-------|----------|--------------|----------|
| Priority | Meta[0] | `P0`, `P1`, `P2`, `P3` | Yes |
| Size | Meta[1] | `XS`, `S`, `M`, `L` | Yes |
| Status | Meta[2] | `READY`, `IN_PROGRESS`, `REVIEW`, `DONE`, `BLOCKED` | Yes |
| Focus | Meta[3] | `Focus:yes`, `Focus:no` | Yes |
| Class | Meta[4] | non-empty string | Yes |
| CLI | Meta[5] | non-empty string | Yes |
| Context | Meta[6] | path(s) or `none` | Yes |
| Acceptance Criteria | Body | At least one `- [ ]` or `- [x]` | Yes |
| Hansei | Section | M/L/XL: mandatory. XS/S: triggered only (blocker, size miss, anomaly). | Conditional |

---

## Overview
ARCH v1.0 simplifies the Meta line by removing the `Value` field, prioritizing Priority and Size as the primary metrics for backlog ordering.

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

## Hansei — tiered obligations

Hansei requirements are proportional to task size:

| Size | Hansei required? | Notes |
|------|-----------------|-------|
| XS   | No              | Closes directly to DONE when `arch review` passes. No Hansei block needed. |
| S    | No              | Optional — write one if you discovered something worth tracking. |
| M    | Yes             | Full Hansei block required at close. Wizard runs automatically. |
| L    | Yes             | Full Hansei block + Auditor review required. |

For XS/S, Hansei is triggered-basis: write one if you hit something genuinely worth recording.
For M/L, the wizard pre-fills Severity/Category/Constraint/Cost/ForwardAction from the diff scan.
The only mandatory human input is the **Decision** field (one sentence minimum).


## Approval

```markdown
## Approval
Approved-by: Auditor | <ISO-date>
```

Written by the Auditor when verifying ACs and setting status to DONE. Required on M/L/XL tasks closed via human Auditor review.

**Exempt:** XS and S tasks — self-archive eligible per L3 gate (ADR-009). Approval is implicit in the autonomous promotion log.

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

#### cmd: predicates (optional)
An AC item may include an executable predicate or an exemption marker appended after a `→` separator:

```markdown
- [ ] `arch review` passes  →  cmd: arch review; exit: 0
- [ ] Tests pass            →  cmd: npm test --prefix cli; exit: 0
- [ ] File exists           →  file: docs/PRINCIPLES.md
- [ ] Logic implemented     →  grep: "export class Reviewer" cli/src/main/ts/domain/services/reviewer.ts
- [ ] Manual check          →  prose: verified with visual inspection
```

**Syntax:** 
- `→  cmd: <shell command>; exit: <expected-exit-code>`
- `→  file: <path>` (passes if file exists)
- `→  grep: "<pattern>" <path>` (passes if pattern found in file)
- `→  prose: <reason>` (exempts from machine verification)

**Behaviour:**
- `arch task review TASK-XXX` runs all predicates before setting status to REVIEW. A failing predicate blocks the transition.
- `arch validate --acs TASK-XXX` runs predicates and reports pass/fail per AC.
- ACs without a predicate or `prose:` marker will trigger a warning in `arch validate` and may block future automated transitions.
- Predicates are executed from the repository root with a 30-second timeout.

### 7. Definition of Done (DoD)
- Project-level quality standards (e.g., "PR approved", "`arch review` passes").
- **XS tasks: Definition of Done is optional and omitted by default.** The stripped capture template for XS tasks does not include a DoD section. Operators may add one manually if the task warrants it, but absence is not a lint violation for XS.

### 8. Turns (optional)
- Appended to the Meta line at close, after the Context field, by the implementing agent.
- **Format:** `Turns: N` (e.g., `**Meta:** P2 | S | DONE | Focus:no | 6-writing | local | docs/ | Turns: 12`)
- **Definition:** One "turn" is one full agent request/response cycle within the execution session.
- **Required:** When the agent records a Hansei section (i.e., same triggers: size delta, blocker, or M+).
- **Purpose:** Input for Mura detection in THINK Phase 3 and Turns-per-Size trend in METRICS.md.

## Auxiliary Fields

Fields persisted below the Meta line by the lifecycle system. Not part of the Meta line itself.

| Field | Example | Written by |
|-------|---------|------------|
| `Locked-commit` | `**Locked-commit:** abc1234` | `arch task start` — records HEAD at IN_PROGRESS |
| `Closed-at` | `**Closed-at:** 2026-05-23T10:00:00Z` | `arch task done` — ISO-8601 timestamp |
| `Created-at` | `**Created-at:** 2026-05-22T08:00:00Z` | `arch task new` — ISO-8601 timestamp |
| `Actor` | `**Actor:** claude-code` | `arch task start` — agent identifier |

These fields are read-only after being set. They are used by `DeterministicHanseiChecker` (Locked-commit), `MetricsEngine` (Closed-at, Created-at), and `EvidenceCollector` (Actor).


- **M/L/XL:** Mandatory structured Hansei on every close.
- **XS/S:** Hansei only when a triggering condition applies: (a) actual size differed from estimate, (b) a blocker was encountered, (c) constitutional or process anomaly. No Hansei required on a clean XS/S close.
- If a Hansei section is present on any task, it is validated for correctness regardless of size.
- **Format:** Structured diagnostic block (ADR-019).
- **Audit:** Hansei is audited for epistemological reconciliation. Under-declaration or inflation are governance violations.

```markdown
## Hansei
**Severity:** [H0|H1|H2|H3a|H3b]
**Category:** [Controlled Vocabulary]

**Decision:**
[The specific technical or process compromise made.]

**Constraint:**
[The pressure or missing info that forced the compromise.]

**Cost:**
[The specific debt or risk introduced.]

**Forward Action:**
[Link to an IDEA, escalation, or specific cleanup task, if applicable.]
```

### Severity Levels
- **H0 (Observation):** No debt. Optimization note.
- **H1 (Localized Debt):** Contained compromise.
- **H2 (Systemic Friction):** Repeating issue. **Requires Evidence** (≥3 occurrences). Must generate an obligatory `IDEA`.
- **H3a (Blocking Invalidity):** Violates principles. Blocks closure.
- **H3b (Escalated Risk):** Constitutional risk. Requires **Architect Override** and **Expiry Task**.

### Category (Controlled Vocabulary)
- **Technical:** `[TypeHack]`, `[LeakyAbstraction]`, `[DeferredTest]`, `[ContextWaste]`, `[SymbolDiscovery]`, `[HiddenDependency]`, `[SpecDrift]`
- **Process:** `[ProcessViolation]`, `[PrematureOptimization]`, `[ReviewBlindspot]`, `[MissingDecisionRecord]`
- **Constitutional:** `[ProvenanceBreak]`, `[IntegrityCorruption]`, `[FailOpenBehavior]`, `[AuditGap]`

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
