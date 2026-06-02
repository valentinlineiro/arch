# IDEA: Hansei signal quality degrades at scale

**Status:** DRAFT
**Created:** 2026-06-02
**Source:** Strategic retrospective — 468+ tasks closed, category inflation observed
**Candidate-class:** 1-code-reasoning
**Candidate-size:** S
**Depends:** none
**Decision:** Pending human review.

## Problem

After 468 tasks, Hansei categories ([SpecDrift], [TypeHack]) are applied mechanically. Forward Action fields are frequently placeholders dressed to pass validation. The corpus records history but the signal-to-noise ratio of individual Hanseis is degrading. High volume → low signal per entry.

## Signals

- Forward Action "None required" passes validation on XS tasks
- [SpecDrift] is now the default category when nothing better fits
- Corpus confidence scores remain low despite large corpus size
- arch ask returns low-confidence results — quantity is not compensating for quality

## Proposed Solution

Two mechanisms:

1. **Hansei quality scoring** — score each Hansei on specificity (references a file/AC/command), actionability (Forward Action is a real next step, not a placeholder), and novelty (category hasn't been used 5+ times on the same file). Surface score in arch review without blocking.

2. **Category entropy detection** — when a single category accounts for >40% of Hanseis in a sprint, emit a CORPUS_ALERT: category inflation may indicate the taxonomy needs a new axis, not the same category applied broadly.

## Validation hints

- arch corpus audit scores improve after addressing low-quality Hanseis
- Sprint with category inflation warning prompts author to refine categories
