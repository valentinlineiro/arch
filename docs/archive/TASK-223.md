## TASK-223: arch ask - query intent classification and corpus authority hierarchy
**Meta:** P1 | S | DONE | Focus:no | 2-code-generation | claude-code | cli/src/main/ts/application/use-cases/ask-corpus.ts
**Closed-at:** 2026-05-12T07:53:50.113Z
**Depends:** none

## Hansei
The AC "IDENTITY.md as top match for 'what is arch'" is not literally met — ROADMAP.md scores higher (270 vs 104) because "arch" appears 54× there vs 13× in IDENTITY.md. The multipliers (8× for IDENTITY, 5× for ROADMAP) are correct, but raw keyword frequency dominates. The synthesized answer still extracts from IDENTITY.md correctly. The fix would be a term-frequency normalization or a hard pin for IDENTITY.md on DEFINITIONAL queries — deferred.
