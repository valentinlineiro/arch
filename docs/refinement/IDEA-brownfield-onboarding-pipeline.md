# IDEA: brownfield-onboarding-pipeline
**Decision-required:** yes
**Created:** 2026-05-22
**Source:** ARCH comprehensive review + strategic reframing
**Status:** DRAFT
Sessions: 3

## Problem

ARCH is adoptable only from greenfield. Almost all real repos are brownfield — 50k+ lines of existing code with no governance. Currently:

- A team must understand ARCH *before* they can use it. No path from "I have a messy repo" to "I use ARCH."
- `arch audit` exists but produces data nobody consumes. The sensor works; the pipeline to convert that into adoption doesn't.
- ARCH's only structural moat (reading actual code) is unused as an entry point.

**The existential risk:** auto-generating convincing garbage. A wrong ADR is worse than no ADR. If `arch init --brownfield` produces fake architecture, the user concludes "another AI hallucination toy" and never returns. Generation undermines trust faster than discovery builds it.

## Proposed solution

**Phase 1 — `arch audit` as repo MRI (adquisición)**

```
npx @valentinlineiro/arch audit --public https://github.com/user/repo
```

No install, no config, no account. Works on any public repo.

Output is a **shareable structural MRI**:
- Architecture graph (modules, entities, edges)
- Hotspots (god classes, cyclic dependencies, unstable modules)
- Coupling analysis (hidden coupling, boundary mismatches vs. runtime)
- Risk zones (abandoned architecture, fake coverage, orphan services)
- Module candidates (suggested boundaries, not canonical truths)

**No ADRs. No governance. No doctrine.** Only structural observations.

The output must be:
- Visual (terminal graph + link to hosted render)
- Shareable (screenshot-worthy summary: "4 hotspots, 31 orphan services, 18% hidden coupling")
- Linkable (each audit gets a URL)

This converts ARCH from "framework" to "utility." Utilities grow faster than frameworks.

**Phase 2 — `arch init --brownfield` (trust → governance)**

```
arch init --brownfield .
```

Only after Phase 1 has built trust. Generates:
- `.arch/deployment-map.json` — the structural index
- Governance scaffolding (ARCH.md, basic rules) — **no ADRs**
- Suggested architectural observations — **not canonical truths**
- Draft tasks from detected risks — optional, user decides

The deployment map is the key asset. It is the semantic topology, operational memory, governance substrate, and contextual routing layer for the repo. It feeds everything that follows.

**Phase 3 — The compounding loop**

```
More repos analyzed → Better structural heuristics → Better onboarding → Better governance suggestions → Better outcomes → More repos analyzed
```

This is not telemetry obsession — it's structural fingerprinting with minimal data:
- Entity layout (hashed names, preserved topology)
- Edge distribution (density, direction, cyclicity)
- Language composition
- Framework signatures (file layout patterns)

Pre-loaded baselines: **5, not 20.** Next.js, Express, Spring Boot, Django, Rails. Nothing more until there are real users demanding it.

**Phase 4 — Deployment map as governance substrate**

The map feeds:
- Task context injection (which files are structurally related)
- Dependency suggestions from actual coupling, not manual `**Depends:**`
- Drift detection ("This refactor changed entities that 3 tasks depend on")
- Impact analysis and refactor prediction
- Agent orchestration routing

### Pipeline completo

```
audit --public → trust → init --brownfield → governance → enrichment
   (lead)         (skeptic)     (user)         (customer)    (advocate)
```

Cada etapa es un funnel. No se salta. La governance se gana, no se instala primero.

### Competidores reales

Esto no compite con AI PM tools ni governance frameworks. Compite con:

- Sourcegraph (code intelligence, pero no estructural)
- CodeSee (visualization, pero no governance)
- Architectural intelligence tools (pero fragmentados)

Ese mercado es menos saturado y ARCH tiene una ventaja: puede pasar del MRI a la governance sin cambiar de herramienta.

## Dependencies
- `arch audit` output format needs a consumer
- Deployment map schema may need adjustments for governance routing
- 5 baselines need to be pre-audited before launch

## Estimated size
M — Phase 1 is ~1 week. Phase 2 depends on deployment map stability.

## Gaps
- Audit adapters (TS, Java, Python) are regex-based and shallow. For Phase 1 to be trustworthy, detection needs to be good enough that structural observations aren't misleading.
- 5 baselines: need a decision on exact repos (remix? nuxt? which version of each?).
- Shareable artifact: where is it hosted? Needs a lightweight server or GitHub Pages integration.
- Large monorepo handling: 10k+ entities needs compression or tiered summarization.

## Decision
