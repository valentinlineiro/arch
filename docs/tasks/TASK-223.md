## TASK-223: arch ask - query intent classification and corpus authority hierarchy
**Meta:** P1 | S | IN_PROGRESS | Focus:yes | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/ask-corpus.ts
**Depends:** none

### Context
arch ask v1/v2 ranks by keyword frequency. A definitional query ("what is the point of this repo?") returns archive noise because it has no notion of canonical documents or query intent. The system knows how to search but not what to believe.

Four query classes with distinct corpus priorities:
- DEFINITIONAL: IDENTITY.md > ADRs > ROADMAP > PRINCIPLES (suppress archive)
- HISTORICAL: archive + KAIZEN-LOG + RETRO + ADRs (suppress canonical docs)
- STRUCTURAL: ADRs + guidelines + tasks (medium weight on archive)
- PATTERN: archive failures + RETRO + KAIZEN-LOG (recurring signal boost)

Output must lead with a synthesized answer for definitional queries before listing evidence.

### Acceptance Criteria
- [ ] Query is classified into DEFINITIONAL / HISTORICAL / STRUCTURAL / PATTERN / GENERAL before scoring → prose: verified by reading output for each class
- [ ] Definitional queries hard-prioritize IDENTITY.md, ROADMAP, PRINCIPLES, ADRs over archive tasks → prose: "what is arch" returns IDENTITY.md as top match
- [ ] Definitional queries show a synthesized answer extracted from IDENTITY.md before the match list → prose: verified manually
- [ ] Historical queries prioritize archive, KAIZEN-LOG, RETRO → prose: "why did auth fail" surfaces archive tasks above ADRs
- [ ] Pattern queries boost recurring signal detection → prose: verified by output
- [ ] Unit tests cover classification logic and scoring multipliers → cmd: npm test --prefix cli; exit: 0
- [ ] arch review passes → cmd: arch review; exit: 0

### Definition of Done
- [ ] All ACs checked.
- [ ] arch review passes.
- [ ] npm test passes in cli/.

### Hansei
<!-- to be filled on close -->
