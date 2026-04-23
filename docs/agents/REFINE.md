# REFINE.md
<!-- Refinement protocol — load when invoked on docs/REFINEMENT.md -->
<!-- ~300 tokens | Only needed in REFINE mode -->

## Protocol
1. Read the draft proposal in `docs/REFINEMENT.md`
2. Optionally read (only if clearly relevant):
   - Most recent ADR that touches the same area
   - Last entry in `docs/RETRO.md`
3. Do not read the full backlog, full codebase, or full docs/

## Your output has two parts

### Part 1: Gaps
Questions the proposal doesn't answer that will block implementation.
Format: `- [ ] [Specific question]`

Identify:
- Missing acceptance criteria (what does "done" look like?)
- Unresolved dependencies (does another task need to complete first?)
- Contradictions with existing ADRs or GUIDELINES
- Ambiguous scope (what is explicitly out of scope?)
- Missing context (what does the implementer need to know that isn't written?)

### Part 2: Kaizen suggestions
Patterns from project history relevant to this proposal.
Only cite patterns with evidence. Never generic advice.
Format: `- [Observation from history] → [Suggested implication for this task]`

## Hard constraints
- Never write the acceptance criteria yourself — ask for them
- Never promote the task to BACKLOG — the human does that
- Never say "looks good" — if gaps exist, surface them; if none exist, say so explicitly
- Maximum 400 tokens in your response
