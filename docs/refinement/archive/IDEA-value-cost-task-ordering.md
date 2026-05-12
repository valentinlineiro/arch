# IDEA: Value/Cost ordering in arch next
**Created:** 2026-05-06
**Source:** Human — "I miss a way to optimize work with arch: task prioritization, cost optimization"
**Status:** DRAFT
**Meta:** P2 | S | claude-code | cli/src/main/ts/application/use-cases/select-next-task.ts, cli/src/main/ts/domain/services/

## Problem
`arch next` ranks tasks by Priority (P0–P3) then task ID. Within the same priority tier, two P1/M tasks are treated as equivalent even if one costs 3× more (e.g., a `7-operations` XS task vs a `2-code-generation` M task). There is no mechanism to surface cheaper high-value work first, which leaves cost optimization entirely to human judgment at task-creation time.

## Proposed solution
Add a cost-heuristic tiebreaker to `SelectNextTask`:

1. **Cost bucket from existing metadata:** Derive a cost score from class + size without new task fields.
   - Size weights: XS=1, S=3, M=8, L=21 (Fibonacci).
   - Class multiplier: `7-operations` × 0.5, `6-writing` × 0.7, `2-code-generation` × 1.0 (code generation is the most expensive).
   - Cost score = size_weight × class_multiplier.
2. **Tiebreaker in `arch next`:** When Priority is equal, rank by cost score ascending (cheapest first). Focus:yes still wins unconditionally.
3. **`arch next --explain`:** Print the selected task with its cost score and the runner-up, so the human can see why one task was chosen over another.

No new fields required on task files. No migration needed.

## Dependencies
- TASK-193 (`arch next`) must be DONE — it is (REVIEW state).
- Optionally: IDEA-cost-aware-protocol for actual cost data to validate/calibrate the heuristic over time.

## Estimated size
S — update `SelectNextTask` scoring, add `--explain` flag to `next-command.ts`, unit tests for cost ordering.

## Gaps
- **Class multipliers are unvalidated:** The proposed multipliers (0.5/0.7/1.0) are heuristics. If METRICS.md accumulates enough data, they could be calibrated. Until then, they are arbitrary.
- **Focus:yes interaction:** If multiple tasks have Focus:yes (valid today), cost ordering applies among them — is this the desired behavior?
- **Human override:** If a human prefers a more expensive task, today they set it to Focus:yes. Is that sufficient, or is a `Value: high` override field needed?

## Decision
<!-- Human writes here after THINK evaluation -->
<!-- PROMOTE → TASK-XXX | REJECT: reason -->

## Decision
REJECT: The heuristic is honest and technically implementable. The failure class is priority displacement: IDENTITY.md §6 names arch ask v1 as the current bottleneck — not task selection quality within a tier. Improving `arch next` tiebreaking while the primary constraint is queryable memory is optimizing the wrong thing. The unvalidated multipliers (0.5/0.7/1.0) are also a concern — they would require empirical calibration from cost data that doesn't yet exist (see IDEA-cost-aware-protocol). Return to this after arch ask v1 is operational and actual cost distribution across task classes is observable.
