# IDEA: semantic-collision-detection
**Created:** 2026-05-18
**Source:** Operator session — preventing "Groundhog Day" re-litigation of settled decisions
**Status:** DRAFT
**Meta:** P2 | M | claude | cli/src/main/ts/application/commands/capture-command.ts, docs/adr/, cli/src/main/ts/application/use-cases/ask-corpus.ts

## Problem

ADRs encode settled architectural decisions — decisions that were hard-won and written down specifically so they do not have to be re-litigated. When a new task's Acceptance Criteria contradict an existing ADR, the contradiction is typically undetected until `arch review` or `arch govern reflect` — after the task has been defined, refined, committed, and partially or fully implemented.

The cost compounds: the agent implements against the AC in good faith, the contradiction surfaces at review, the implementation is rejected, and the decision gets re-argued. This is the "Groundhog Day" pattern — not because anyone forgot the ADR, but because the task entry point never checked it.

Semantic Collision Detection catches this at the boundary: when an AC is written, not when implementation is reviewed.

## Proposed solution

**New preflight check during `arch task capture` and `arch task start`.**

At both entry points, run a Semantic Conflict Check between the task's Acceptance Criteria text and all `ACCEPTED` ADRs in `docs/adr/`. Emit an advisory if a high-confidence conflict is detected.

**Detection algorithm:**

1. Extract domain terms from each AC line (nouns, technical identifiers, action verbs — strip prepositions and articles).
2. For each ACCEPTED ADR, extract the decision text and constraint text.
3. Compute token overlap between AC domain terms and ADR domain terms.
4. If overlap ≥ threshold AND a negation or exclusion relationship is detectable in the ADR text (`must not`, `never`, `prohibited`, `all X must`, `only via`), flag as a candidate conflict.
5. Apply a minimum confidence bar: ≥3 shared domain terms required before a conflict is reported. Below that threshold, suppress silently — partial overlap is noise.

**Output format (stdout only):**

```
  ── ADR Conflict Advisory ───────────────────────────────────────
  AC: "Add a local in-process cache for session tokens"
  Conflicts with: ADR-012 (ACCEPTED) — "All state must be managed via Redis"
    Constraint: "Local caches are prohibited; state must be externally consistent"
    Confidence: HIGH (shared terms: cache, state, session; exclusion: prohibited)
  ─────────────────────────────────────────────────────────────────
  Advisory only. To escalate: arch govern approve TASK-XXX --conflict ADR-012
  To dismiss: add <!-- adr-conflict-dismissed: ADR-012 --> to the task AC.
```

**Invariants:**

- **Advisory only, never blocking.** The task is created or started regardless. A conflict advisory is not a `SENTINEL_VIOLATION` — it is a prompt for human judgment, not a gate.
- **ACCEPTED ADRs only.** DRAFT and DEPRECATED ADRs are excluded from the check. Only settled decisions can produce conflict signals.
- **Minimum confidence bar enforced.** < 3 shared domain terms → no output. The system is silent when uncertain. This is the opposite of a string-matching cop: it suppresses rather than over-reports.
- **Dismissal mechanism required.** An operator who has read the ADR and determined the conflict is not real must have a way to dismiss the advisory without suppressing all future checks. The `<!-- adr-conflict-dismissed: ADR-NNN -->` annotation in the task file records the deliberate dismissal.
- **Stdout only.** Conflict advisories do not write to INBOX, escalations.jsonl, or the task file unless the operator explicitly escalates.

**Escalation path (operator-initiated):**
If the operator agrees the conflict is real: `arch govern approve TASK-XXX --conflict ADR-NNN` writes a `SENTINEL_VIOLATION` entry to `.arch/escalations.jsonl` with the ADR reference. This is a human decision, not an automated one.

## Why this approach is not a "string-matching ADR cop"

The confidence bar (≥3 shared domain terms + detectable negation) is the critical design choice. It filters out:
- Tasks that mention a technology touched by an ADR but don't contradict it ("use Redis for caching" when ADR-012 requires Redis — no conflict)
- Tasks with incidental term overlap ("session" appearing in both a UI task and an auth ADR)
- ADRs that constrain behavior without using explicit negation language

The result is: only cases where the AC is doing something the ADR explicitly prohibits or restricts get flagged. Everything else is silent. Operators train on whether the system's positives are trustworthy; a low false-positive rate is more valuable than high recall.

## What this is not

- Not a semantic reasoner. It does not understand intent — it detects structural negation patterns against shared domain terms.
- Not a blocker. The operator always proceeds; they just have information.
- Not a replacement for `arch review`. ADR drift can still be introduced without triggering this check (e.g., through subtle implementation choices not reflected in the AC text).

## Implementation notes

The existing `AskCorpus` (used by `arch memory ask`) already reads and tokenizes the ADR store. The detection algorithm can reuse the tokenization layer. The negation pattern scan is a small addition to the existing corpus query path.

## Dependencies
- `docs/adr/` with at least one ACCEPTED ADR. Pre-existing.
- `AskCorpus` tokenization layer. Pre-existing.

## Estimated size
M

## Gaps
<!-- THINK fills this section — do not edit manually -->

## Decision
PROMOTE → TASK-940
[influenced-by: none]
