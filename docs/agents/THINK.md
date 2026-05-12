# THINK.md
<!-- ARCH v0.6.0 — Modular Thinking & Continuous Kaizen -->

## Phase 1: Context & Replenishment (Conductor)
0. **Print:** `[THINK] Phase 1 — Context & Replenishment` to stdout.
1. **Note:** `arch govern` was already executed by the CLI to trigger this session.
2. **Health Evaluation:** Identify P0 tasks that are blocked or not focused. If a task is `IN_PROGRESS` with a lock > 3 days, create a P1 `READY` bug task in `docs/tasks/`.
3. **INBOX Regeneration:** Overwrite `docs/INBOX.md` with current loop status, active/READY task counts, pending items (`AWAITING_PROMOTION`, `AWAITING_REVIEW`), and summaries of the last 5 completed tasks. **Refinement Queue:** Count all `IDEA-*.md` files in `docs/refinement/` (excluding `archive/` and `TEMPLATE.md`) and list each title; write "No pending ideas." only when the count is zero. Commit with `[THINK]` tag.
4. **Evidence Required:** Every recommendation must cite a concrete signal (e.g., 'TASK-003 has stale lock').

## Phase 2: Idea Refinement (Refine)
0. **Print:** `[THINK] Phase 2 — Idea Refinement` to stdout.
1. Scan `docs/refinement/` for `IDEA-*.md` files. Triage: process all IDEAs with a `Decision:` field first; for DRAFT IDEAs, process at most 3 per session.
2. **Constraint evaluation framework (apply to every DRAFT IDEA):** Each dimension is an independent axis. Multiple can be active simultaneously. Identify which axes are violated before writing any lifecycle output.

   | Axis | Violation signal | Notes |
   |------|-----------------|-------|
   | **Dependency ordering** | Requires something not yet built or operational | Distinct from temporal validity — prerequisites may be done but evidence absent |
   | **Temporal validity** | Insufficient empirical base for this to be meaningful | "The data that would make this useful doesn't exist yet" |
   | **Abstraction layer** | Wrong level of the system stack; a simpler/lower layer could solve the same problem | Common failure: new layer where a direct fix would do |
   | **Observability validity** | Required observable doesn't exist in reliable form | Distinct from temporal validity — data may never be reliably producible, not just absent now |
   | **Priority displacement** | Valid idea, valid data, wrong bottleneck for current system pressure | Rarely causes rejection alone; primarily sets priority; reference IDENTITY.md §6 |

   A DRAFT IDEA that passes all five axes is **structurally admissible**. That is necessary but not sufficient for promotion. Structural admissibility means: no known constraint axis is violated. It does not mean the IDEA is good — only that it is not currently inadmissible. Human decision is required to activate it.

   New axes may be discovered during adjudication. When a rejection rationale genuinely doesn't fit any existing axis, name it explicitly in the rejection — the taxonomy is empirically derived, not closed.

3. For each IDEA, apply lifecycle rules:
   - **DRAFT:** Identify gaps, map active constraint axes, and estimate. Output to terminal only. Increment `**Sessions:** N` counter in the IDEA file (add field if missing). If `Sessions >= 3`, emit `[STALE-IDEA] IDEA-slug — N sessions without Decision` to stdout. If `Sessions > 3` and still no Decision, move it to `docs/refinement/archive/` with status `REJECTED: TTL expired` — do not re-evaluate.
   - **REJECTED (human-written):** If the Decision field contains `REJECT:`, move the IDEA to `docs/refinement/archive/` immediately. No re-evaluation. No session increment. Commit with `chore: [THINK] archive [IDEA-slug] — REJECTED by human decision`.
   - **DECIDED (PROMOTE):** If human Decision is written and IDEA is XS + 6-writing/7-operations, promote autonomously: update status to `PROMOTED -> TASK-XXX`, create task file, and archive IDEA. Then:
     1. Append a PROMOTE record to `.arch/reflect-proposals.jsonl` at confidence 1.0 (records that THINK executed a human decision, not that THINK proposed it).
     2. Parse the Decision field for an attribution annotation using this tristate:
        - `[influenced-by: THINK-abc123, THINK-def456]` → `influence_declared: true`, proposals cited
        - `[influenced-by: none]` → `influence_declared: true`, `based_on_proposals: []` (declared non-influence — human engaged with attribution and confirmed REFLECT did not influence the decision)
        - No annotation → `influence_declared: false`, `based_on_proposals: []` (undeclared — distinct from declared non-influence; do not conflate)
     3. Append to `.arch/reflect-decisions.jsonl`:
        ```json
        {"decision_id":"D-<8-char-uuid>","timestamp":"<ISO-8601>","target":"<IDEA-slug>","outcome":"PROMOTE","finality":"committed","influence_declared":<true|false>,"based_on_proposals":["THINK-abc123"]}
        ```
        All decisions written here carry `finality: "committed"` — there is no provisional state in the current flow. A committed decision can only be corrected by appending a supersession record; never by mutation.
     Attribution must be explicit or absent — never inferred from temporal proximity to a proposal.
   - **REJECTED:** Move to `docs/refinement/archive/`.
3. **Phase boundary:** This phase does NOT create tasks directly. All IDEA promotion requires a human Decision field.

## Phase 2.5: Semantic Drift Analysis (Observer)
0. **Print:** `[THINK] Phase 2.5 — Semantic Drift Analysis` to stdout.
1. **Skip condition:** If running under time pressure or minimal-mode flag, skip this phase and print `[THINK] Phase 2.5 — skipped`.
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
7. **Analysis — Governance class boundary audit:** Read existing DriftChecker check names and any IDEAs or ADRs in the last 30 days that introduced governance rules. For each, assess: does the check's actual behavior match its declared class (Class I / Class II per `docs/GOVERNANCE.md`)? Specifically: is any Class I check using commit message content, file presence, or naming patterns as a proxy for architectural intent or correctness? If yes, emit `[SEMANTIC-DRIFT] class-boundary-violation: <check-name> — declared Class I but implicitly evaluating: <claim>`. This step requires human interpretation — it is itself a Class II analysis. Do not emit without concrete evidence of scope overreach; absence of evidence is not a finding.
   Additionally, run two protocol degeneration proxies (per `docs/GOVERNANCE.md §Terminal failure mode`):
   - **Cross-rule repetition**: Compare `Does NOT evaluate` fields across all governance rules introduced in the last 90 days. If any two share >60% textual overlap (excluding stop words), emit `[SEMANTIC-DRIFT] protocol-degeneration-signal: <rule-A> ≈ <rule-B> — Does NOT evaluate field appears templated rather than discovered`. This is a surface-pattern signal only — do not infer intent, do not count as a violation.
   - **Rule longevity**: Identify any governance rule (DriftChecker check, ADR, or GOVERNANCE.md section) whose class assignment has not been re-examined in 6+ months (judged by last git modification date of the file containing it). Emit `[SEMANTIC-DRIFT] governance-stale: <rule-name> — class assignment not re-examined since <date>`. Surface only, not a failure.
   Both proxies can be satisfied with ritual compliance and cannot detect conceptually empty entries. They are early-warning patterns, not verdicts. The terminal limit is stated in GOVERNANCE.md and is not resolvable by adding more proxies.
8. **Output rule:** For each finding that warrants action (steps 4–7), create a new IDEA file in `docs/refinement/IDEA-<slug>.md` with `Source: Phase-2.5` in the Meta line. Do NOT create tasks directly. Do NOT modify DriftChecker or any enforcement layer.
9. **Max output:** At most 3 new IDEAs per THINK run from steps 4–7. Weak signal decay emissions (step 3) are not subject to this cap — all due signals must be surfaced in the same session.
10. **Phase boundary:** This phase is a semantic observer, not an enforcement layer. Its output feeds Phase 2 (refinement queue) and Phase 3 (Kaizen). It never feeds `arch review` or `DriftChecker`.

## Phase 3: Continuous Kaizen (Real-time Reviewer)
0. **Print:** `[THINK] Phase 3 — Continuous Kaizen` to stdout.
1. **Kaizen Learning:** Run `arch review --json`. If failures exist (and aren't in `docs/KAIZEN-LOG.md` exceptions), analyze violations/drift against `docs/PRINCIPLES.md` (primary context) and `docs/KAIZEN-LOG.md` (audit trail). If a violation matches an existing principle, reference it. If it represents a new pattern, propose a new principle entry and a hardening task (`fix:` or `feat:`) to prevent recurrence.
2. **Mura Detection:** Read `Turns: N` from the last 10 archived tasks. For each size tier (XS/S/M/L), compute the average. If actual avg exceeds the expected range in `docs/METRICS.md` by >50%, emit `[MURA] <size>-tier avg=N turns (threshold=T)` to stdout and propose a re-estimation or decomposition task.
3. **Immediate Improvements:** Identify context gaps or guideline changes based on patterns observed across phases.
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
