## IDEA: User issue reporting — surface downstream findings to arch

**Status:** DRAFT
**Created:** 2026-05-27
**Source:** Downstream project smartcart-os surfaced two rule gaps (system-commit exemption, IDEA Decision integrity check) that required manual copy-paste to reach arch. There is no formal channel for arch users to report issues or findings back to the upstream project.
**Candidate-class:** 2-code-generation
**Candidate-size:** S
**Depends:** none

---

## Problem

When using arch in downstream projects, users encounter issues, rule gaps, and improvement opportunities. Today, the only path to reporting them is manual: copy the text, switch to the arch repo, and paste it. There is no structure, no command, and no guarantee the report reaches the right intake queue.

The smartcart-os example illustrates the gap concretely:
- THINK found that `core.md §2` technically forbids `[THINK]`/`[GOVERN]` system commits (no TASK-ID).
- THINK found that PROMOTED IDEAs can reference wrong task IDs with no check.
- Both findings were hand-copied into this conversation as an unstructured IDEA block.

If this flow is not automated, findings accumulate in project-local INBOXes and are never promoted.

---

## Proposed Solution

Introduce `arch report` (or `arch issue`) — a command that captures an issue from the current project and prepares it for upstream submission:

```
arch report "<description>" [--kind bug|idea|guideline] [--from <project-name>]
```

**Behaviour:**

1. Writes a structured IDEA draft to `docs/refinement/IDEA-<slug>.md` in the *arch* project (not the calling project). This can be done by:
   - Opening an editor with a pre-populated template, or
   - Writing the file directly if running from within the arch repo, or
   - Printing the draft to stdout for copy-paste if running from a downstream project.

2. The draft includes:
   - Source project name and date
   - Kind (`bug`, `idea`, `guideline`)
   - Description
   - A pre-populated Acceptance Criteria template appropriate to the kind

3. For the `--kind guideline` class, the draft includes a "Proposed Changes" section with the current text and a placeholder for the replacement.

**Out of scope for this IDEA:**
- Automated git push / GitHub issue creation (requires network auth, scope too broad)
- Aggregation dashboard

---

## Example

The smartcart-os finding in the user's message maps to:

```
arch report "THINK/GOVERN commits violate core.md §2 (no TASK-ID); system commits need explicit exemption" \
  --kind guideline --from smartcart-os
```

This would generate `docs/refinement/IDEA-system-commit-exemption.md` with the proposed text already populated.

---

## Acceptance Criteria

- [ ] `arch report "<description>" [--kind <kind>] [--from <project>]` command exists
- [ ] Running from the arch repo writes the draft to `docs/refinement/IDEA-<slug>.md`
- [ ] Running from a downstream project prints the draft to stdout with instructions to paste it into the arch repo
- [ ] Draft includes: source, date, kind, description, Acceptance Criteria stub
- [ ] `--kind guideline` draft includes a "Proposed Changes" section
- [ ] `arch review` passes

---

## Bundled issue: smartcart-os findings

The following is the concrete issue that triggered this IDEA, provided as a bundled report for immediate action regardless of whether `arch report` is implemented:

### Finding 1 — System-commit exemption (core.md §2)

**Current text:** "Every commit must reference a TASK-ID."

**Problem:** `arch analyze` and `arch govern` produce commits tagged `[THINK]` or `[GOVERN]` with no associated task. These are system commits, not implementation work. The rule as written technically flags them.

**Proposed fix:** Add: "System commits from `arch analyze` and `arch govern` are exempt; they must carry a mode tag (`[THINK]`, `[GOVERN]`) instead."

### Finding 2 — IDEA Decision integrity (core.md or autonomy.md)

**Problem:** A PROMOTED IDEA's `Decision: PROMOTE → TASK-XXX` field can reference the wrong task ID (found: IDEA-auth → TASK-018 which was an onboarding fix, not auth). No check catches this.

**Proposed fix:** During THINK Phase 1, cross-check every PROMOTED IDEA's referenced task title against the IDEA intent. Mismatches surface as a Data Integrity Alert in INBOX.

---

## Decision

DEFER. Bundled findings extracted to TASK-1065 (system-commit exemption) and TASK-1066 (IDEA Decision integrity). The `arch report` command is deferred to ROADMAP-IDEAS — trigger: ≥3 downstream installations not controlled by the primary maintainer hit the upstream-reporting friction. See `docs/refinement/ROADMAP-IDEAS.md#arch-report-downstream-findings`.
