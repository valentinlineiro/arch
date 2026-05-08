## TASK-220: Automatic entity linking — guidelines↔failures
**Meta:** P1 | M | DONE | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/
**Depends:** TASK-218

### Context
Materialize guidelines↔failures relationships in the ContextIndex by parsing RETRO.md and KAIZEN-LOG.md, and surface those links through ContextInference scoring.

### Acceptance Criteria
- [x] ContextIndex version bumped to 4 with `failures` and `guidelineFailureLinks` fields
- [x] `RETRO.md` parsed for failure patterns and risks
- [x] `KAIZEN-LOG.md` parsed for protocol, tool, and context frictions
- [x] Guideline-failure links created deterministically via filename mention and keyword overlap
- [x] ContextInference surfaces matched failure patterns in Relevant Context
- [x] ContextInference scores guidelines and historical files based on failure context
- [x] All existing tests pass; new tests cover parsing and scoring logic

### Definition of Done
- [x] All ACs checked.
- [x] `npm test` passes in `cli/`.

## Hansei
This completes the Phase 1 Feature 3 scope. By linking failures to guidelines, we close the loop on ARCH's institutional memory. The system now doesn't just record what we decided (ADRs) and what we did (Tasks), but also what went wrong (Failures) and how we adapted (Guidelines). This makes guidelines actionable by surfacing them exactly when the operator is entering a known "danger zone" identified by keywords or task references.

## Hansei
Guideline-failure linking completes Phase 1 Feature 3. The deterministic parsing of retros and Kaizen log provides a reliable causal bridge without LLM overhead.
