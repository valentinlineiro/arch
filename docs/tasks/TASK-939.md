## TASK-939: Implement correction signal schema and capture points
**Meta:** P2 | M | READY | Focus:no | 2-code-generation | claude | .arch/, cli/src/main/ts/application/use-cases/escalation-store.ts, cli/src/main/ts/application/commands/task-command.ts

### Context

Human corrections at review time contain repo-specific knowledge: the delta between a generic model's prior and the project's actual constraints. Currently that delta is captured as a REVIEW_FAIL or REDIRECT entry in escalations.jsonl — recording that a correction happened, not what was wrong or why. Without structure, correction events cannot be aggregated, clustered, or promoted to injected constraints.

This task implements the correction signal schema and the three initial capture points. It does not implement clustering or TENSION promotion (that is THINK's job once signals accumulate).

### Non-Goals

- No clustering or TENSION promotion logic in this task. THINK handles aggregation; this task creates the store and capture points only.
- No changes to REVIEW_FAIL or REDIRECT behavior. Correction signal capture is additive.
- Single corrections never become injected constraints automatically. Only corroborated, operator-promoted signals reach that authority level.

### Gaps

- **summary field authorship**: at REVIEW_FAIL time, the agent knows what failed but the human provides the correction. The summary must be written by the correcting human, not inferred by the agent from the AC failure text. Capture point must prompt (or accept a `--correction` flag) rather than auto-generate.
- **category field at capture time**: the Hansei controlled vocabulary is the clustering key. The capture UI must present the vocabulary, not accept free-form text. Consider a short-form alias table (e.g., `sd` → `[SpecDrift]`) for CLI ergonomics.
- **`.arch/correction-signals.jsonl` initialization**: file may not exist on first capture. Must be created on first append without failing.

### Acceptance Criteria

- [ ] `.arch/correction-signals.jsonl` schema implemented with fields: `signal_id`, `timestamp`, `source_type`, `task_ref`, `file_refs`, `adr_refs`, `category` (Hansei vocab), `correction_kind` (factual|style|authority|scope), `summary`, `corroboration_count`, `authority` (low|medium|high), `status`.  →  file: .arch/correction-signals.jsonl (after first capture)
- [ ] Capture point 1: `arch task done --redirect TASK-XXX` prompts for a one-line summary and category, then appends a correction signal with `source_type: redirect`, `authority: low`.  →  prose: verified by redirecting a task and inspecting the signal file
- [ ] Capture point 2: `arch govern approve TASK-XXX --correction "<category>: <summary>"` appends a correction signal with `source_type: operator_override`, `authority: low`.  →  prose: verified by running arch govern approve with --correction flag and inspecting the signal file
- [ ] Capture point 3: correction signal entries include `file_refs` derived from the task's Context field and `adr_refs` populated when the task's content references an ADR-NNN pattern.  →  prose: verified by inspecting a captured signal for a task with ADR references
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0
- [ ] CLI tests pass.  →  cmd: npm test --prefix cli; exit: 0

### Definition of Done

- [ ] A REVIEW_FAIL or REDIRECT event can be accompanied by a structured correction signal without leaving the CLI.
- [ ] Correction signals are queryable as a flat jsonl file with enough structure to support future THINK-driven clustering.
- [ ] `arch review` passes.  →  cmd: bash scripts/arch.sh review; exit: 0

## Hansei
**Severity:** H0
**Category:** [MissingDecisionRecord]

**Decision:**
Correction signal capture is additive — does not change existing REVIEW_FAIL or REDIRECT behavior. Clustering and TENSION promotion are explicitly out of scope for this task; THINK handles aggregation once signals exist.

**Constraint:**
The summary field authorship gap is the highest-risk design choice. If the capture point auto-generates summaries from AC failure text, the signal will be systematically biased toward implementation failures rather than architectural misjudgments. The prompt-or-flag approach is slower but produces accurate signals.

**Cost:**
Operators who skip the --correction flag will leave corrections uncaptured. The signal accumulation rate depends on operator discipline, not automated detection. Acceptable for the first implementation; a THINK check for REVIEW_FAIL events without matching signals can nudge operators toward capture.

**Forward Action:**
After 20+ correction signals accumulate, evaluate clustering quality. If categories are too coarse (all signals land in [SpecDrift]), refine the category vocabulary or add sub-categories.
