<!-- CANONICAL SOURCE: docs/AGENTS.md — Hansei taxonomy, lifecycle rules, idempotency rule defined there. -->
# THINK.md
<!-- ARCH v1.3.0 | Reflection and continuous improvement protocol -->
<!-- DEFAULT MODE: Phase 1 + Phase 2 steps only. DEEP MODE: all phases. -->

## Phase 1 [DEFAULT]: Context & Replenishment
0. Print `[THINK] Phase 1 — Context & Replenishment` to stdout.
1. **Health check:** Identify P0 blocked or unfocused tasks. If an IN_PROGRESS task has no commit activity for >3 days, create a P1 READY bug task.
2. **Replenishment:** Count READY tasks in `docs/tasks/`. If < 3: write `[ADVISORY][READY-FLOOR-BREACH] READY count dropped to N` to `docs/INBOX.md`, then propose ≤ 3 new IDEAs in `docs/refinement/`. Commit with `[THINK]` tag. See **Appendix A** for cap rules and edge cases.
3. **TTL enforcement:** For each `IDEA-*.md` in `docs/refinement/`, if Sessions ≥ ttlCycles (default 10) and Decision is empty: mark `**Status:** STALE` and append `[STALE-IDEA] <slug> — N sessions without Decision` to `docs/INBOX.md`.
4. **INBOX regeneration** (wrap in try/catch — failure is non-fatal): Overwrite `docs/INBOX.md` with: loop status, READY/IN_PROGRESS counts, AWAITING_* items, last 5 closed tasks, refinement queue titles. All THINK-written entries use `[ADVISORY]` prefix unless a deterministic prefix applies (see **Appendix B**). Commit with `[THINK]` tag.

## Phase 2 [DEFAULT/DEEP]: IDEA Refinement
0. Print `[THINK] Phase 2 — Idea Refinement` to stdout.
1. **Hansei pattern synthesis:** Read `.arch/causal-signal.jsonl`, group by Hansei category. Count ≥ 3: create `docs/tensions/TENSION-XXX.md`. Count ≥ 5: also append `[PATTERN-ALERT]` to `docs/INBOX.md`.
2. **Triage IDEAs:** Process decided IDEAs first; process at most 3 DRAFT IDEAs per session. Apply the 5-axis constraint framework (see **Appendix C**) before making a lifecycle decision.
3. **Lifecycle rules:**
   - DRAFT: output analysis to terminal. Increment `**Sessions:** N`. If Sessions ≥ 2 and Decision empty: add `**Decision-required:** yes`.
   - PROMOTE (human Decision): create task, archive IDEA, append to `.arch/reflect-proposals.jsonl` and `.arch/reflect-decisions.jsonl`. Agent-written decisions append `author:agent`.
   - DEFERRED / REJECTED (human-written): move to `docs/refinement/archive/`. Never auto-archive without human Decision.
4. Phase boundary: no tasks created directly. All promotion requires human Decision field.

## Phase 2.5 [DEEP]: Semantic Drift Analysis
0. Print `[THINK] Phase 2.5 — Semantic Drift Analysis` to stdout.
1. Check for contradictions between guideline files → `[SEMANTIC-DRIFT] contradiction:`.
2. Check for structural duplication across guidelines → `[SEMANTIC-DRIFT] duplication:`.
3. Check ACCEPTED ADRs for rationale drift vs current system → `[SEMANTIC-DRIFT] adr-drift:`.
4. Weak signal decay: for each signal in `docs/tensions/weak-signals.md` past its `Adjudicate by:` date, emit `[TENSION-DECAY]` with `[REFLECT-SUGGESTS]` tag and append to `.arch/reflect-proposals.jsonl`.
5. Output: ≤ 3 new IDEAs per run from steps 1–4. Decay emissions uncapped.

## Phase 3 [DEEP]: Continuous Kaizen
0. Print `[THINK] Phase 3 — Continuous Kaizen` to stdout.
1. Run `arch review --json`. Analyze violations against `docs/PRINCIPLES.md`. Emit `[KAIZEN]` only with a concrete signal from Phase 1, 2, or 2.5 — no signal, no emission.
2. **Mura detection:** Read `Turns: N` from last 10 archived tasks. If avg exceeds expected range by >50%, emit `[MURA]`.
3. **Sprint metrics:** Run `arch govern report` to update `docs/METRICS.md`.

## Output
Terminal-only except INBOX writes and file mutations above.
`[THINK] Done` is the final stdout line.

---

## Appendix A — Replenishment edge cases
- **Cap:** Never propose more than 3 new IDEAs in one session regardless of READY count.
- **Queue bottleneck:** If READY < 3 but refinement queue has ≥ 5 unresolved DRAFTs, write the INBOX entry but skip creating a new IDEA.
- **Admission gate:** IDEAs need a clear deliverable and known acceptance shape. Exploratory ideas without these go to `docs/refinement/ROADMAP-IDEAS.md`, not individual files.

## Appendix B — ADR-034 prefix whitelist
Deterministic prefixes (no `[ADVISORY]` required): `[ANDON_HALT]`, `[AWAITING_TRIAGE]`, `[CORPUS_ALERT]`, `[PATTERN-ALERT]`, `[STALE_TASK]`, `[STALE-IDEA]`, `[READY-FLOOR-BREACH]`, `[FLOW-REGRESSION]`. All other THINK-written entries use `[ADVISORY]`.

## Appendix C — 5-axis constraint framework
| Axis | Violation signal |
|------|-----------------|
| Dependency ordering | Requires something not yet built |
| Temporal validity | Insufficient empirical base |
| Abstraction layer | Wrong level of the stack |
| Observability validity | Required observable doesn't exist reliably |
| Priority displacement | Valid idea, wrong bottleneck for current pressure |

A DRAFT passing all 5 axes is structurally admissible — not necessarily good. Human decision still required.

## Appendix D — Decomposition heuristic (M/L tasks)
Mandatory decomposition when ALL: spans >2 independent concerns, each independently testable, first concern ships value alone. Acceptable as single task when ANY: concerns share deep state, ≤ 5 ACs, prior decomposition attempt produced phantom tasks.
