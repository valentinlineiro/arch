# ADR-024: Drift Coverage Identity Model

**Date:** 2026-05-19
**Status:** ACCEPTED
**Deciders:** Valentín Liñeiro

## Context

ARCH's DriftChecker emits named signals (e.g., `HanseiPresent`, `EscalationMaturity`). IDEAs describe proposed interventions. These two layers are semantically coupled — an IDEA for "add Hansei enforcement" covers the `HanseiPresent` drift check — but no shared identity primitive exists. The system cannot mechanically determine:

1. Whether a WARN drift signal already has a pending IDEA.
2. Whether the backlog is complete (every persistent WARN has a corresponding IDEA or accepted task).
3. Whether an IDEA's scope has been invalidated by a drift check being removed or renamed.

Three options were evaluated:

**Option A — IDEA-centric:** IDEAs declare coverage via a structured `covers:` field listing drift check names. The coverage query scans IDEAs for matching check names.

**Option B — Drift-centric:** The drift checker or `arch.config.json` carries a `coveredBy:` pointer to an IDEA slug for each check. Coverage is maintained in the checker's configuration layer.

**Option C — Relational primitive:** A dedicated `.arch/coverage-map.jsonl` file stores `(check_name, idea_slug, status)` tuples as an append-only linking layer, decoupled from both IDEAs and the drift checker.

## Decision

**Option A (IDEA-centric)** is adopted as the primary model.

IDEAs may declare coverage of drift checks via a `**Covers:**` line in their metadata block:

```
**Covers:** HanseiPresent, EscalationMaturity
```

Coverage is resolved as follows:

1. **Covered:** A WARN drift signal is covered if at least one IDEA in `docs/refinement/` with status DRAFT or EXTEND has a `Covers:` field containing that check name, OR if an active task (READY/IN_PROGRESS/REVIEW) in `docs/tasks/` references the check name in its context field or title.
2. **Uncovered:** A WARN signal is uncovered if no matching IDEA or task exists.
3. **Unknown:** An IDEA without a `Covers:` field makes no coverage claim — it does not count as covering or not covering any signal. Unknown is fail-open: it does not trigger a coverage violation.
4. **Stale:** An IDEA with a `Covers:` field whose referenced check no longer exists in the DriftChecker is a stale coverage claim and should be flagged.

## Rationale

Option A was chosen over B and C for three reasons:

**Lightweight.** IDEAs already describe what they fix in prose. Adding `Covers:` is a natural structured annotation, not a new artifact or a change to the drift checker's internals. The query is a single grep over `docs/refinement/`.

**Fail-open.** IDEAs without `Covers:` are ignored — they do not pollute the coverage map with false positives. This allows gradual adoption: new IDEAs add the field; existing IDEAs are not required to be retrofitted immediately.

**IDEA lifecycle is the right anchor.** Coverage is meaningful only while an intervention is pending. When an IDEA is REJECTED or PROMOTED (and its task is DONE), the drift check it addressed is either resolved or re-enters the uncovered pool. The IDEA lifecycle already encodes this — no separate state machine is needed.

Option B was rejected because maintaining `coveredBy:` pointers in the drift checker couples the observation layer to the intervention layer — violating ADR-016 (domain layer boundary). Option C was deferred: it is the correct migration path if the number of IDEAs exceeds ~100 and grep becomes unreliable, but introduces ceremony that is not yet warranted.

## Coverage query algorithm

```
for each DriftResult with status WARN:
  check_name = result.check
  covered = false
  for each IDEA in docs/refinement/ with status DRAFT or EXTEND:
    if IDEA.covers contains check_name:
      covered = true; break
  if not covered:
    for each Task in docs/tasks/ with status READY|IN_PROGRESS|REVIEW:
      if check_name in task.context or task.title:
        covered = true; break
  if not covered:
    emit DriftCoverage WARN: "{check_name}: no IDEA or active task claims coverage"
```

Stale claim detection:

```
for each IDEA with a Covers: field:
  for each check_name in Covers:
    if check_name not in DriftChecker.registeredChecks:
      emit DriftCoverage WARN: "IDEA {slug}: Covers references unknown check '{check_name}'"
```

## Implementation notes

This ADR defines the model. Implementation is a separate task:

- A `DriftCoverage` check is added to `DriftChecker.check()`.
- The `Covers:` field is parsed from IDEA frontmatter by `parseIdeaCovers(content: string): string[]`.
- Registered check names are derived from the `check` field of all `DriftResult` objects returned by `DriftChecker.check()` — no separate registry needed.
- No retroactive requirement on existing IDEAs. The field is optional; unknown is fail-open.

## Consequences

- IDEA authors can optionally declare which drift checks their IDEA addresses. This makes the backlog auditable.
- `arch review` gains a `DriftCoverage` check that surfaces persistent WARNs with no pending intervention.
- Stale `Covers:` fields are flagged when a drift check is removed or renamed — a lightweight consistency gate between the two layers.
- Migration to Option C (relational primitive) is a non-breaking upgrade: the `.arch/coverage-map.jsonl` file can be generated from existing `Covers:` fields and extended from there.

## Referenced-by
**Files:** cli/src/main/ts/application/use-cases/drift-checker.ts
**Note:** Drift coverage identity model — DriftChecker implements coverage checks
