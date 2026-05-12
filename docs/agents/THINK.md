# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->

## Phase 1: Intent Operationalization (Signal Interpreter)
0. **Print:** `[THINK] Phase 1 — Intent Operationalization` to stdout.
1. Scan `docs/intents/` for all files with `status: CAPTURED`.
2. For each CAPTURED intent, assess: **can this signal be transformed into bounded operational work?**
3. Apply outcome:
   - **PROMOTED:** Create a TASK draft in `docs/tasks/` with the raw intent as context. Set `promoted_to: [TASK-XXX]` in the INTENT file. Set `status: PROMOTED`. Do **not** set the task status to READY — human confirms READY.
   - **SIGNAL:** Retained operational knowledge — friction, pattern, systemic observation. Append an interpretation entry, set `status: SIGNAL`. Record a note if it relates to an active concern.
   - **SUPERSEDED:** Intent absorbed by an existing TASK or INTENT. Set `superseded_by: [TASK-XXX|INTENT-XXX]`, set `status: SUPERSEDED`.
   - **DISCARDED:** No signal value. Set `status: DISCARDED` with a one-line note in the interpretation.
4. For every processed intent, append to its `interpretations` block:
   ```yaml
   - timestamp: <ISO-8601>
     actor: THINK
     classification: <bug|refactor|arch-concern|friction|research|signal-only>
     notes: "<reasoning>"
     confidence: <low|medium|high>
   ```
   `confidence` is a **hint only** — it never affects routing, promotion, or state.
5. **Phase boundary:** This phase does NOT perform governance, replenishment, or idea refinement. If a SIGNAL suggests a kaizen improvement, defer it to Phase 4.
6. **Evidence Required:** Each outcome decision must cite a concrete signal (e.g., "maps to ADR-002 concern", "covered by TASK-077").

## Phase 2: Context & Replenishment (Conductor)
0. **Print:** `[THINK] Phase 2 — Context & Replenishment` to stdout.
1. **Note:** `arch govern` was already executed by the CLI to trigger this session.
2. **Health Evaluation:** Identify P0 tasks that are blocked or not focused. If a task is `IN_PROGRESS` with a lock > 3 days, create a P1 `READY` bug task in `docs/tasks/`.
3. **INBOX Regeneration:** Overwrite `docs/INBOX.md` with current loop status, active/READY task counts, pending items (`AWAITING_PROMOTION`, `AWAITING_REVIEW`), and summaries of the last 5 completed tasks. **Refinement Queue:** Count all `IDEA-*.md` files in `docs/refinement/` (excluding `archive/` and `TEMPLATE.md`) and list each title; write "No pending ideas." only when the count is zero. Commit with `[THINK]` tag.
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 has stale lock').

## Phase 3: Idea Refinement (Refine)
0. **Print:** `[THINK] Phase 3 — Idea Refinement` to stdout.
1. Scan `docs/refinement/` for `IDEA-*.md` files. Triage: process all IDEAs with a `Decision:` field first; for DRAFT IDEAs, process at most 3 per session.
2. For each IDEA, apply lifecycle rules:
   - **DRAFT:** Identify gaps, dependencies, and estimate. Output to terminal only. Increment `**Sessions:** N` counter in the IDEA file (add field if missing). If `Sessions >= 3`, emit `[STALE-IDEA] IDEA-slug — N sessions without Decision` to stdout. If the IDEA was already flagged `[STALE-IDEA]` in the previous session (Sessions > 3) and still has no Decision, move it to `docs/refinement/archive/` with status `REJECTED: TTL expired`.
   - **DECIDED:** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA. Then:
     1. Append a PROMOTE record to `.arch/reflect-proposals.jsonl` at confidence 1.0 (records that THINK executed a human decision, not that THINK proposed it).
     2. Parse the Decision field for an attribution annotation using this tristate:
        - `[influenced-by: THINK-abc123, THINK-def456]` → `influence_declared: true`, proposals cited
        - `[influenced-by: none]` → `influence_declared: true`, `based_on_proposals: []` (declared non-influence — human engaged with attribution and confirmed REFLECT did not influence the decision)
        - No annotation → `influence_declared: false`, `based_on_proposals: []` (undeclared — distinct from declared non-influence; do not conflate)
     3. Append to `.arch/reflect-decisions.jsonl`:
        ```json
        {"decision_id":"D-<8-char-uuid>","timestamp":"<ISO-8601>","target":"<IDEA-slug>","outcome":"PROMOTE","influence_declared":<true|false>,"based_on_proposals":["THINK-abc123"]}
        ```
     Attribution must be explicit or absent — never inferred from temporal proximity to a proposal.
   - **REJECTED:** Move to `docs/refinement/archive/`.
3. **Phase boundary:** This phase does NOT interpret INTENT signals or create tasks from intents.

## Phase 3.5: Semantic Drift Analysis (Observer)
0. **Print:** `[THINK] Phase 3.5 — Semantic Drift Analysis` to stdout.
1. **Skip condition:** If running under time pressure or minimal-mode flag, skip this phase and print `[THINK] Phase 3.5 — skipped`.
2. **Inputs to read:** `docs/guidelines/*.md` (full content), `docs/adr/*.md` (Context + Decision sections of ACCEPTED ADRs), `docs/tasks/` (Meta lines + ACs only), `docs/archive/` (Meta lines only), `docs/refinement/IDEA-*.md` (DRAFT and PROMOTED entries), `docs/tensions/weak-signals.md` (full content).
3. **Analysis — Weak signal decay:** Read `docs/tensions/weak-signals.md`. For each signal with an `**Adjudicate by:**` deadline that has now been reached (count this THINK session as one review against that deadline), emit to stdout: `[TENSION-DECAY] <signal-area>: resolution due — <current classification> — [REFLECT-SUGGESTS] PROMOTE | DEMOTE | EXTEND — rationale: <one sentence>`. Tag suggestions explicitly as `[REFLECT-SUGGESTS]` so they are distinguishable from human decisions in the divergence record. Do NOT make the decision. Do NOT modify the signal record. The pressure signal is output only — human or GOVERN decides the outcome. If a signal has already been extended once and is past its extended deadline, add `FINAL — no further extension valid` to the emission.
   **After each `[REFLECT-SUGGESTS]` emission**, generate a `proposal_id` of the form `THINK-<8-char-uuid>` and include it in the stdout line: `[REFLECT-SUGGESTS] PROMOTE — id: THINK-abc123 — rationale: <one sentence>`. Then append to `.arch/reflect-proposals.jsonl`:
   ```json
   {"proposal_id":"THINK-abc123","timestamp":"<ISO-8601>","target":"<signal-area>","type":"PROMOTE|DEMOTE|EXTEND","confidence":<0.0-1.0>,"rationale_ref":"<one-sentence rationale>","signals_used":["<signal-area>"]}
   ```
   Use confidence 0.7 for standard suggestions, 0.9 for FINAL (no further extension valid) signals. The `proposal_id` must appear in stdout so that humans can cite it in their subsequent Decision annotation (`[influenced-by: THINK-abc123]`). This record is the persistent trace of what REFLECT proposed — it is not a decision record.
4. **Analysis — Conceptual contradictions:** Identify any two guideline sections that assert conflicting behaviors for the same domain (e.g., commit frequency defined differently in two files). If found, emit `[SEMANTIC-DRIFT] contradiction: <file-A>:<section> vs <file-B>:<section> — <description>` to stdout.
5. **Analysis — Structural duplication:** Identify materially identical sections or rules appearing in more than one guideline file. If found, emit `[SEMANTIC-DRIFT] duplication: <file-A>:<section> ≈ <file-B>:<section>` to stdout.
6. **Analysis — ADR conceptual drift:** Identify ACCEPTED ADRs whose stated rationale conflicts with how the system currently operates (judged against active tasks and current guidelines). If found, emit `[SEMANTIC-DRIFT] adr-drift: <ADR-ID> — rationale no longer matches observed system behavior` to stdout.
7. **Output rule:** For each finding that warrants action (steps 4–6), create a new IDEA file in `docs/refinement/IDEA-<slug>.md` with `Source: Phase-3.5` in the Meta line. Do NOT create tasks directly. Do NOT modify DriftChecker or any enforcement layer.
8. **Max output:** At most 3 new IDEAs per THINK run from steps 4–6. Weak signal decay emissions (step 3) are not subject to this cap — all due signals must be surfaced in the same session.
9. **Phase boundary:** This phase is a semantic observer, not an enforcement layer. Its output feeds Phase 3 (refinement queue) and Phase 4 (Kaizen). It never feeds `arch review` or `DriftChecker`.

## Phase 4: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 4 — Continuous Kaizen` to stdout.
1. **Kaizen Learning:** Run `arch review --json`. If failures exist (and aren't in `docs/KAIZEN-LOG.md` exceptions), analyze violations/drift against `docs/PRINCIPLES.md` (primary context) and `docs/KAIZEN-LOG.md` (audit trail). If a violation matches an existing principle, reference it. If it represents a new pattern, propose a new principle entry and a hardening task (`fix:` or `feat:`) to prevent recurrence.
2. **Mura Detection:** Read `Turns: N` from the last 10 archived tasks. For each size tier (XS/S/M/L), compute the average. If actual avg exceeds the expected range in `docs/METRICS.md` by >50%, emit `[MURA] <size>-tier avg=N turns (threshold=T)` to stdout and propose a re-estimation or decomposition task.
3. **Immediate Improvements:** Identify context gaps or guideline changes based on patterns. SIGNALed intents from Phase 1 may surface relevant friction here.
4. **Sprint Metrics:** On sprint close, generate `docs/METRICS.md` summary using the Sprint Template block.
5. **Periodic Architecture Revision (bi-weekly):** Read the `Last-Revision:` field at the bottom of `docs/KAIZEN-LOG.md`. If the field is absent or its date is more than 14 days before today, run a focused architecture audit; otherwise skip this step. Use `docs/METRICS.md` cost-per-task and turns-per-task data as the primary signal for identifying friction candidates (skip if fewer than 5 tasks are recorded). Produce a numbered list of concrete streamlining proposals — each must be an actionable proposal, not an observation — formatted as:
   ```
   [REVISION] <N>. <proposal> → <next action: IDEA draft docs/refinement/IDEA-<slug>.md | direct fix in <file>>
   ```
   Output to terminal only. If a proposal warrants a task, create an IDEA draft in `docs/refinement/IDEA-<slug>.md` and commit with `idea:` prefix. After completing the audit, append `Last-Revision: YYYY-MM-DD` (today's date) to `docs/KAIZEN-LOG.md` and commit with `[THINK]` tag.

## Output
- Ephemeral read-only output to terminal.
- Kaizen: `[KAIZEN] [proposal] — rationale: [rationale]`
- Autonomy: `[SELF-PROMOTION] IDEA-ID to TASK-ID — criteria: [L2 requirements met]`
- Revision: `[REVISION] <N>. <proposal> → <next action>`
- **Finally, print:** `[THINK] Done` to stdout.
