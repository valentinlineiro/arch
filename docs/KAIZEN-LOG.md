# KAIZEN-LOG
<!-- Record of weak points, friction, and bottlenecks in ARCH -->
<!-- Categories: Protocol | Tool | Context -->
<!-- Format: each entry in plain language, no quantitative metrics in v1 -->

---

## Protocol

- **Decision Blindness (High Velocity)** *(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent.

- **Bugs without formal registration** *(Sprint 3)*: `arch review` WARNs had no defined path to the backlog. TASK-041/042/043 were created manually after detection. The bug protocol (TASK-040) resolved this, but friction persisted throughout Sprint 2 and part of Sprint 3.

- **Legacy tasks with stale dependencies** *(Sprint 3)*: TASK-007, TASK-014, TASK-021 referenced RETRO.md, HUMAN.md, and monolithic SPRINT.md — all deleted in Sprint 3. Required manual triage. Signal: when an artifact is deleted, actively search for references in the backlog.

- **Sprint vs backlog as structural duplication** *(Sprint 3)*: Saying "move everything to sprint" left the backlog empty — evidence the separation was artificial. TASK-047 was promoted to resolve this with a single-directory model + Focus field.

---

## Tool

- **`arch review` does not validate ACs before archiving** *(Sprint 3)*: TASK-031 was archived as DONE but with unchecked ACs. The reviewer detected the inconsistency but did not block archival at the time. Detection arrived late (next session).

- **Batch lock commit fails TASK-ID validator** *(Sprint 3)*: Locking 4 tasks in a `[SPRINT]` commit caused `arch review` to report a format violation. The validator assumes a single TASK-ID per commit — batch planning commits are an uncovered edge case.

- **`arch --version` does not exist as a subcommand** *(Sprint 3)*: The drift checker compares versions by reading package.json directly because the CLI does not implement `--version`. This is a functional workaround but inconsistent with standard CLI conventions.

---

## Context

- **Unstructured IDEAs before TASK-033** *(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary.

- **Legacy terminology in legacy backlog** *(Sprint 3)*: CONDUCTOR, EXEC, DISPATCH.md, monolithic SPRINT.md — v0.1 terms that survived the modular migration. Required manual triage to detect and update.
