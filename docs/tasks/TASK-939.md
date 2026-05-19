## TASK-939: Implement correction signal schema and capture points
**Meta:** P2 | M | REVIEW | Focus:no | 2-code-generation | claude | .arch/, cli/src/main/ts/application/use-cases/escalation-store.ts, cli/src/main/ts/application/commands/task-command.ts
**Actor:** unknown
**Locked-commit:** 9a8aa9b9
**Created-at:** 2026-05-19T13:11:39.747Z

### Context

Human corrections at review time contain repo-specific knowledge: the delta between a generic model's prior and the project's actual constraints. Currently that delta is captured as a REVIEW_FAIL or REDIRECT entry in escalations.jsonl — recording that a correction happened, not what was wrong or why. Without structure, correction events cannot be aggregated, clustered, or promoted to injected constraints.

This task implements the correction signal schema and the three initial capture points. It does not implement clustering or TENSION promotion (that is THINK's job once signals accumulate).


### Relevant Context
_confidence: 0.42_

**Files:**
- cli/src/main/ts/domain/models/context-index.ts _(core)_
- cli/src/main/ts/domain/models/task.ts _(core)_
- cli/src/main/ts/application/use-cases/escalation-store.ts _(domain)_
- cli/src/main/ts/domain/models/causal-signal.ts _(core)_
- cli/src/main/ts/domain/models/causal-relation.ts _(core)_

**ADRs:**
- ADR-014: Causal Graph Schema for Chronicle _(enforced)_
- ADR-015: Causal Signal Arbitration Layer _(enforced)_
- ADR-017: Deterministic Observability & Operational Metrics _(enforced)_

**Guidelines:**
- testing-a-change.md
- versioning.md

**Failure Patterns:**
- Invariant Discovery Gap*(2026-05-12)*: The boundary ambiguity between `arch govern` (deterministic enforcement) and THINK (LLM analysis) was not surfaced by any ARCH mechanism. No DriftChecker rule, no structural check, no semantic scan detected it. A human noticed it during a reflection session. The specific risk: `arch govern` triggers THINK via `runConduct()`, creating naming confusion between enforcement and advisory synthesis — with no written invariant to refuse the rationalization "THINK already participates in govern, so it can also…". **Resolution:** Constitutional split written in IDENTITY.md §7. IDEA-architectural-tension-capture proposed as a new artifact class for structural ambiguities that are not yet broken but will be misused. **The deeper pattern:** ARCH models tasks, decisions, and causal edges, but not category errors or ontological drift. Invariants that live only in the author's head do not scale. _(docs/KAIZEN-LOG.md)_
- Decision Blindness (High Velocity)*(Sprint 3)*: The agent executes architectural changes (ADR) and detects bugs (TASK-061) that stay in logs or PRs without immediate human visibility. High velocity (35 tasks/48h) makes individual monitoring impossible. **Proposal:** GOVERNANCE.md contract + INBOX.md weekly dashboard + `arch inbox` agent. _(docs/KAIZEN-LOG.md)_

### Context Feedback
- [ ] accurate — files and ADRs were on-target
- [ ] partial — correct direction, missing key files
- [ ] off — wrong files dominated

### Non-Goals

- No clustering or TENSION promotion logic in this task. THINK handles aggregation; this task creates the store and capture points only.
- No changes to REVIEW_FAIL or REDIRECT behavior. Correction signal capture is additive.
- Single corrections never become injected constraints automatically. Only corroborated, operator-promoted signals reach that authority level.

### Gaps

- **summary field authorship**: at REVIEW_FAIL time, the agent knows what failed but the human provides the correction. The summary must be written by the correcting human, not inferred by the agent from the AC failure text. Capture point must prompt (or accept a `--correction` flag) rather than auto-generate.
- **category field at capture time**: the Hansei controlled vocabulary is the clustering key. The capture UI must present the vocabulary, not accept free-form text. Consider a short-form alias table (e.g., `sd` → `[SpecDrift]`) for CLI ergonomics.
- **`.arch/correction-signals.jsonl` initialization**: file may not exist on first capture. Must be created on first append without failing.

### Acceptance Criteria

- [x] `.arch/correction-signals.jsonl` schema implemented with fields: `signal_id`, `timestamp`, `source_type`, `task_ref`, `file_refs`, `adr_refs`, `category` (Hansei vocab), `correction_kind` (factual|style|authority|scope), `summary`, `corroboration_count`, `authority` (low|medium|high), `status`.  →  file: .arch/correction-signals.jsonl (after first capture)
- [x] Capture point 1: `arch task done --redirect TASK-XXX` prompts for a one-line summary and category, then appends a correction signal with `source_type: redirect`, `authority: low`.  →  prose: verified by redirecting a task and inspecting the signal file
- [x] Capture point 2: `arch govern approve TASK-XXX --correction "<category>: <summary>"` appends a correction signal with `source_type: operator_override`, `authority: low`.  →  prose: verified with arch govern approve TASK-939 --correction "[SpecDrift]: test" — CS-2afbaad1 logged with source_type: operator_override
- [x] Capture point 3: correction signal entries include `file_refs` derived from the task's Context field and `adr_refs` populated when the task's content references an ADR-NNN pattern.  →  prose: CS-2afbaad1 contains file_refs (5 files from TASK-939 Context) and adr_refs (ADR-014, ADR-015, ADR-017)
- [x] `arch review` passes.  →  cmd: arch review; exit: 0
- [x] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [x] A REVIEW_FAIL or REDIRECT event can be accompanied by a structured correction signal without leaving the CLI.
- [x] Correction signals are queryable as a flat jsonl file with enough structure to support future THINK-driven clustering.
- [x] `arch review` passes.  →  cmd: arch review; exit: 0

## Hansei
**Severity:** H2
**Category:** [MissingDecisionRecord]
**Decision:** The summary field authorship constraint was resolved by a prompt-or-flag design: `arch task done --redirect` opens an interactive prompt if `--correction` is not provided; `arch govern approve` accepts `--correction "<category>: <summary>"` as an inline flag. The category field is resolved through an alias table (sd=[SpecDrift], etc.) to reduce friction. File refs and ADR refs are extracted deterministically from the task's Context block — no inference.
**Constraint:** The `--redirect` flag on `arch task done` does not actually redirect the task — it only captures a correction signal before the done transition. This is a UX ambiguity: the command name suggests a different action. The intent was to capture "done-but-redirected" corrections at the boundary. This design requires operators to understand the flag is a signal capture, not a status change.
**Cost:** One M session. The correction signal is additive — no existing behavior changes. Operators who omit `--correction` from `arch govern approve` skip signal capture silently. Acceptable for the first implementation.
**Forward Action:** After 20+ correction signals accumulate, evaluate clustering quality via THINK. See IDEA-corpus-informed-reprioritization for the aggregation model. If categories are too coarse, refine the vocabulary or add sub-categories.
