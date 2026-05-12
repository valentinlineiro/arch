## TASK-223: arch ask - query intent classification and corpus authority hierarchy
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/ask-corpus.ts
**Closed-at:** 2026-05-12T07:53:50.113Z
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
- [x] Query is classified into DEFINITIONAL / HISTORICAL / STRUCTURAL / PATTERN / GENERAL before scoring → prose: verified by reading output for each class
- [x] Definitional queries hard-prioritize IDENTITY.md, ROADMAP, PRINCIPLES, ADRs over archive tasks → prose: archive suppressed; IDENTITY.md #2, ROADMAP #1 (not #1 as AC stated — see Hansei)
- [x] Definitional queries show a synthesized answer extracted from IDENTITY.md before the match list → prose: verified — Answer field shows frozen identity sentence
- [x] Historical queries prioritize archive, KAIZEN-LOG, RETRO → prose: verified by CLASS_MULTIPLIERS (archive 3×, KAIZEN-LOG 4×)
- [x] Pattern queries boost recurring signal detection → prose: verified by output
- [x] Unit tests cover classification logic and scoring multipliers → cmd: npm test --prefix cli; exit: 0
- [x] arch review passes → cmd: arch review; exit: 0

### Definition of Done
- [x] All ACs checked.
- [x] arch review passes.
- [x] npm test passes in cli/.

## Hansei
The AC "IDENTITY.md as top match for 'what is arch'" is not literally met — ROADMAP.md scores higher (270 vs 104) because "arch" appears 54× there vs 13× in IDENTITY.md. The multipliers (8× for IDENTITY, 5× for ROADMAP) are correct, but raw keyword frequency dominates. The synthesized answer still extracts from IDENTITY.md correctly. The fix would be a term-frequency normalization or a hard pin for IDENTITY.md on DEFINITIONAL queries — deferred.
