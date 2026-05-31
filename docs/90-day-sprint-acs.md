# 90-Day Productization Sprint — AC Breakdown

**Sprint:** sprint/v1.2.1-2026-05  
**Locked:** 2026-05-31  
**Status:** Scope locked — additions require a new IDEA filed and decided before scope changes.

---

## Scope is Locked

The four sprint objectives below are the complete scope. Any additions require:
1. A new IDEA filed in `docs/refinement/`
2. A THINK pass decision (PROMOTE/DEFER/REJECT)
3. A task filed and prioritized against existing backlog

No objectives may be added mid-sprint without this process.

---

## Objective 1: `arch init` — zero-prior-knowledge onboarding

**Status: DONE** (TASK-1021, TASK-1023)

**ACs:**
- [x] `arch init` runs on any repo with no prior governance knowledge required. (S)
- [x] Post-init scan surfaces findings in plain language — no protocol jargon, no Meta line syntax, no Focus fields. (S)
- [x] Enforcement demo moment shows pre-commit hook blocking a bad commit and the passing form. (XS)
- [x] `arch fix` command resolves at least 7 common structural issues automatically. (S)
- [x] `arch init` on a repo with existing `.arch/` prints conflict notice instead of crashing. (XS)

**Out of scope:** Existing-governance conflict resolution beyond the notice. Migrating prior `.arch/` state. Multi-repo init.

**Total: M** (3 × XS + 2 × S)

---

## Objective 2: `arch review` — actionable findings with resolution path

**Status: DONE** (TASK-1021, TASK-1022, TASK-1023)

**ACs:**
- [x] `arch review` output surfaces findings in plain language with a resolution path per finding. (S)
- [x] `arch fix` companion command resolves at least one finding class end-to-end (required deliverable). (S)
- [x] `arch review` exit action item: "N issues found. Run `arch fix` to resolve them." (XS)
- [x] `arch review` exit code: 0 when clean, 1 when findings, consistent with CI expectations. (XS)

**Out of scope:** Auto-fixing all finding classes. Interactive guided repair beyond `arch fix`.

**Total: S** (2 × XS + 2 × S)

---

## Objective 3: `arch task capture` — first-use surface without meta leakage

**Status: READY** (not yet implemented — TASK-1074 below)

**ACs:**
- [ ] `arch task capture "<intent>"` creates a valid task from natural language. (S)
- [ ] The Meta line does NOT appear in the first-use surface output — it is written to the task file but not echoed to the user. (XS) ← **meta line leakage explicitly prevented**
- [ ] Output is: task ID, title, and "Run `arch task start TASK-XXX` to begin." Nothing else. (XS)
- [ ] If intent is ambiguous (< 5 words), prompts for clarification before filing. (XS)

**Out of scope:** LLM-generated ACs at capture time. Bulk capture. Import from external trackers.

**Total: S** (1 × S + 3 × XS)

---

## Objective 4: Progressive CLI surface

**Status: DONE** (TASK-1022)

**ACs:**
- [x] `arch help` (default) shows exactly 3 commands: `init`, `review`, `task capture`. (XS)
- [x] `arch help --full` shows the full command inventory. (XS)
- [x] All commands not in the default surface remain fully callable. (XS)
- [x] Implementation vehicle: TASK-1022. ← **references implementation task**

**Out of scope:** Subcommand discovery. Auto-suggest on typo. Shell completions.

**Total: XS** (3 × XS)

---

## Sub-tasks filed

| Objective | Task | Size | Status |
|-----------|------|------|--------|
| 1 — arch init PLG | TASK-1021 | M | DONE |
| 1 — enforcement demo | TASK-1023 | S | DONE |
| 2 — arch fix companion | TASK-1021 | S | DONE (part of init) |
| 3 — arch task capture clean surface | TASK-1074 | S | READY |
| 4 — progressive CLI | TASK-1022 | S | DONE |

---

## Sprint total

| Objective | Size | Status |
|-----------|------|--------|
| 1 — arch init | M | ✔ DONE |
| 2 — arch review + fix | S | ✔ DONE |
| 3 — arch task capture | S | ⏳ TASK-1074 |
| 4 — progressive CLI | XS | ✔ DONE |
| **Sprint** | **L** | 75% done |
