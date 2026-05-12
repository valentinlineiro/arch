# KAIZEN-LOG
<!-- Record of weak points, friction, and bottlenecks in ARCH -->
<!-- Categories: Protocol | Tool | Context -->
<!-- Format: each entry in plain language, no quantitative metrics in v1 -->

---

## Protocol

- **Invariant Discovery Gap** *(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale.

- **Decision Blindness (High Velocity)** *(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent.

- **Bugs without formal registration** *(Sprint 3)*: `arch review` WARNs had no defined path to the backlog. TASK-041/042/043 were created manually after detection. The bug protocol (TASK-040) resolved this, but friction persisted throughout Sprint 2 and part of Sprint 3.

- **Legacy tasks with stale dependencies** *(Sprint 3)*: TASK-007, TASK-014, TASK-021 referenced RETRO.md, HUMAN.md, and monolithic SPRINT.md — all deleted in Sprint 3. Required manual triage. Signal: when an artifact is deleted, actively search for references in the backlog.

- **Sprint vs backlog as structural duplication** *(Sprint 3)*: Saying "move everything to sprint" left the backlog empty — evidence the separation was artificial. TASK-047 was promoted to resolve this with a single-directory model + Focus field.

- **Recursive review violation tasks** *(Sprint 4)*: TASK-112, 113, and 114 show a pattern where a task is created to fix a review violation, but then marked DONE with its own violations (e.g. pending ACs), leading to a chain of cleanup tasks. **Proposal:** Implement pre-archive guards (TASK-115) and enforce AC validation during `arch review`.

- **Stealth Merge Commits** *(Sprint 6)*: Implicit merges from `git pull` violated the "No-Merge" policy. `arch review` initially failed to block them effectively due to a bug in `MergeCommitCheck` (it found the last 20 merges instead of checking the last 20 commits). **Resolved:** Fixed `MergeCommitCheck` in `cli/src/main/ts/infrastructure/cli/git-cli.ts` and hardened protocol.

- **Completed Task Stagnation** *(Sprint 5)*: `TASK-117` was marked DONE but remained in `docs/tasks/`, consuming context and potentially misleading agents. **Proposal:** Implement "Archival Guard" in THINK mode to autonomously move DONE tasks to `docs/archive/`.

- **Focus Interruption** *(Sprint 5)*: When a task is completed, if no other task is `Focus:yes`, velocity drops to zero until human intervention. **Proposal:** "Continuous Flow Guard" in THINK mode should autonomously pick the highest Value/Size ratio task if focus is lost.

- **Protocol Enforcement Lag** *(Sprint v0.6.0-final)*: Rollout of machine-enforced `## Hansei` (TASK-195) occurred before `DO.md` was updated (TASK-197), leading to agents following a stale protocol and being blocked by the CLI. **Proposal:** Mandate "Atomic Protocol Updates" where CLI enforcement and documentation changes are delivered in the same commit or task.

- **Missing Mura Signals** *(Sprint v0.6.0-final)*: Although TASK-182 introduced the `Turns: N` metadata field, agents are not consistently recording this field at task completion. This creates a data gap for THINK Phase 4 (Mura detection). **Proposal:** Automate turn-count recording in the `arch task done` command or within the EXEC loop logic to remove reliance on agent judgment.

- **Level Terminology Collision** *(Sprint v0.6.0-final)*: Simultaneous advancement of "Autonomy Levels" (L1-L4) and "Escalation Maturity" (L1-E7) has led to terminal confusion where "Level 3" has two different meanings. **Proposal:** Adopt distinct prefixes (Capability vs Enforcement) per IDEA-level-terminology-disambiguation.

---

## Tool

- **Phantom Archive Sync Latency** *(Sprint v0.6.0-final)*: Tasks marked `DONE` by an Auditor (human or agent) remain in `docs/tasks/` until the next `arch govern` tick. This creates a "stale backlog" window where `arch status` and INBOX show tasks that are technically complete. **Proposal:** Integrate phantom-archive sync directly into `arch task done`.

- **`arch review` does not validate ACs before archiving** *(Sprint 3)*: TASK-031 was archived as DONE but with unchecked ACs. The reviewer detected the inconsistency but did not block archival at the time. Detection arrived late (next session). *(Resolved by TASK-078)*

- **Batch lock commit fails TASK-ID validator** *(Sprint 3)*: Locking 4 tasks in a `[SPRINT]` commit caused `arch review` to report a format violation. The validator assumes a single TASK-ID per commit — batch planning commits are an uncovered edge case.

- **`arch --version` does not exist as a subcommand** *(Sprint 3)*: The drift checker compares versions by reading package.json directly because the CLI does not implement `--version`. This is a functional workaround but inconsistent with standard CLI conventions. *(Resolved by TASK-072)*

---

## Context

- **Unstructured IDEAs before TASK-033** *(Sprint 3)*: The original TEMPLATE only had `## Proposal` with no structured fields. THINK had to infer gaps without dependency or size context. The first 8 IDEAs were refined with more friction than necessary.

- **Legacy terminology in legacy backlog** *(Sprint 3)*: CONDUCTOR, EXEC, DISPATCH.md, monolithic SPRINT.md — v0.1 terms that survived the modular migration. Required manual triage to detect and update.

---

## Exceptions
<!-- Add specific violation strings here to suppress Kaizen learning from them -->

---

## Persistent WARNs
<!-- Tracking for 5S Seiso (TASK-150) -->
<!-- Format: [WARN String] | [Session Count] -->

Last-Revision: 2026-05-06
