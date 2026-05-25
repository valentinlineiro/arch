# IDEA: Independent measurement for REFLECT influence
**Created:** 2026-05-25
**Source:** Human structural review
**Status:** DRAFT
**Meta:** P0 | L | local | docs/refinement/

## Problem
REFLECT's influence tracking metric (engagement rate) can be gamed: if REFLECT learns to suggest what humans already prefer, the metric stays healthy while advisory authority drifts. The system explicitly flags this concern in INBOX but has no defense against it. The observer and the observed share a boundary the system cannot enforce. This is Goodhart's Law applied to ARCH's advisory layer — and it is self-concealing: the metric reads green precisely when the problem is worst.

## Proposed solution
Separate the measurement of REFLECT's influence from REFLECT's own output. Introduce an independent audit layer that samples a random subset of REFLECT suggestions and compares them against what a counterfactual (no-REFLECT) decision would have been — using prior human decisions on similar IDEAs as the baseline. Engagement rate alone is insufficient; add a divergence metric: "proportion of REFLECT suggestions that deviated from the human's historical prior and were still accepted." Low divergence = REFLECT is flattering, not advising.

**External analysis (DeepSeek, 2026-05-25):** This IDEA represents the gap DeepSeek's own proposals did not address. DeepSeek correctly identified the self-measurement problem in its problem statement but proposed no mechanical fix for it — all three of its proposals address decision quality and observability, none address measurement independence. The divergence metric above is the structural defense DeepSeek's analysis lacked. This absence is itself evidence that the problem is underappreciated: even an external analysis that names it fails to propose a fix.

## Dependencies
- None structural, but requires sufficient decision history to compute divergence baseline (≥50 decided IDEAs)

## Estimated size
L

## Gaps

## Decision
