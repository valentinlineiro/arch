# ROADMAP-IDEAS

Holding file for speculative and exploratory ideas that lack a clear deliverable, known scope, or
acceptance shape. These are not executable candidates yet. To graduate an entry to an individual
`IDEA-*.md` file, it must acquire a specific deliverable, implementation target, and a describable
"done" state. Human decision required to promote any entry here to an individual IDEA file.

---

## backlog-compression

**Source:** Phase-3.6 | **Created:** 2026-05-18 | **Migrated from:** IDEA-backlog-compression.md

**Problem:** `docs/tasks` contains 44+ READY tasks, exceeding the 1000-line Census budget. Many
tasks may be stale or low-priority.

**Direction:** A compression protocol — READY tasks untouched for 60+ days or below P0/P1 could
be moved to a deferred directory or archived as DEFERRED. The protocol definition is not yet
precise enough for a standalone task.

**Gap preventing graduation:** The deferral criteria (what counts as "untouched"? what priority
threshold?) and the acceptance shape (what does "compression done" look like?) need definition
before this becomes an executable candidate.

---

## protocol-upgrade-policy

**Source:** Human question | **Created:** 2026-05-18 | **Migrated from:** IDEA-protocol-upgrade-policy.md

**Problem:** When ARCH upgrades, governed repos face hidden governance drift — CLI enforces rules
the repo hasn't adopted, docs describe rules the CLI no longer implements. No explicit adoption
protocol exists.

**Direction:** Define patch/minor/major classification, evaluation task requirement, and
adopt/defer/reject outcome tracking. Immediate output would be a planning policy doc.

**Gap preventing graduation:** The policy content is undefined — this is an exploratory idea about
what the policy should contain, not a task to implement a known policy. Needs a concrete proposal
before it can be scoped as an executable task.

---

## arch-init-ux

**Source:** ARCH Value Report (2026-05-22) | **Created:** 2026-05-22 | **Migrated from:** IDEA-arch-init-ux.md

**Problem:** Onboarding to ARCH currently requires reading over 50 markdown files and understanding a complex governance corpus.

**Direction:** Implement a streamlined `arch init` command generating a minimal starter corpus and guided first task.

**Gap preventing graduation:** Needs a concrete technical design for the `arch init` implementation and the minimal corpus content.

---

## arch-resume

**Source:** ARCH Value Report (2026-05-22) | **Created:** 2026-05-22 | **Migrated from:** IDEA-arch-resume.md

**Problem:** The "Andon Cord" (ANDON_HALT) creates a high-friction manual recovery process.

**Direction:** Implement `arch resume <taskId>` to automate common recovery paths (budget extension, review failure recovery).

**Gap preventing graduation:** Requires mapping specific HALT states to deterministic recovery actions.

---

## cli-protocol-decoupling

**Source:** ARCH Value Report (2026-05-22) | **Created:** 2026-05-22 | **Migrated from:** IDEA-cli-protocol-decoupling.md

**Problem:** The ARCH CLI is currently "repo-aware" rather than "protocol-aware," with hardcoded paths and rules.

**Direction:** Refactor CLI to operate against a configurable Protocol Schema in `arch.config.json`.

**Gap preventing graduation:** Requires a full audit of hardcoded paths and the design of the Protocol Schema.

## Added by THINK 2026-05-23

- **arch-init-ux** (P3): 2-minute project bootstrap via `arch init`. Generate 3 starter files, guided first task, zero-config review baseline.
- **arch-resume** (P2): `arch resume <taskId>` automates ANDON_HALT recovery paths. Guided resolution, FOCUS_RECOVERED audit trail.
- **cli-protocol-decoupling** (P3): Refactor CLI to operate against configurable Protocol Schema. Configurable paths, rules engine, portable `arch init`.

---

## reflect-independence-measurement

**Source:** Human structural review | **Created:** 2026-05-25 | **Migrated from:** IDEA-reflect-independence-measurement.md

**Problem:** REFLECT's engagement rate metric self-conceals Goodhart's Law: if REFLECT learns to suggest what humans already prefer, the metric stays healthy while advisory authority drifts.

**Direction:** Independent audit layer sampling REFLECT suggestions against counterfactual (no-REFLECT) baseline. Core metric: divergence rate — proportion of suggestions that deviated from the human's historical prior and were still accepted. Low divergence = REFLECT is flattering, not advising.

**Gap preventing graduation:** Requires ≥50 decided IDEAs to compute a meaningful divergence baseline. Current decision history is near zero. Revisit after 90-day sprint completes.

---

## generated-docs-coupling

**Source:** Human structural review | **Created:** 2026-05-25 | **Migrated from:** IDEA-generated-docs-coupling.md

**Problem:** ROADMAP, INBOX, and command references in docs drift the moment they're written because there is no structural coupling between prose artifacts and the state they describe.

**Direction:** Generate documentation from machine-readable state rather than maintaining prose. INBOX summary, ROADMAP phase completion, and command references should be derived from `status-projection.json` and the task archive, not hand-edited.

**Gap preventing graduation:** L-sized with no isolated first deliverable. INBOX split (IDEA-dual-truth-reconciliation) is the only currently-scoped instance. To graduate: identify one additional derivable artifact beyond INBOX and define its generation pipeline as a standalone S task.

---

## arch-report-downstream-findings

**Source:** Downstream project smartcart-os | **Created:** 2026-05-27 | **Migrated from:** IDEA-user-issue-reporting.md

**Problem:** Findings from downstream arch projects (rule gaps, improvement opportunities) have no formal channel back to the arch repo. Today the flow is copy-paste.

**Direction:** `arch report "<description>" [--kind bug|idea|guideline] [--from <project>]` — generates a structured IDEA draft. Running from the arch repo writes the file directly to `docs/refinement/`. Running from a downstream project prints the draft to stdout for paste.

**Gap preventing graduation:** The primary users of this command would be external arch users who don't have direct repo access. Until there is evidence of external users hitting the friction, the value is low — the current user controls both repos and the copy-paste overhead is seconds. Trigger: first external user reports friction getting findings upstream, OR arch gains ≥3 downstream installations not controlled by the primary maintainer.

---

## compliance-front-door

**Source:** Product strategy discussion | **Created:** 2026-05-25 | **Migrated from:** IDEA-compliance-front-door.md

**Problem:** The PLG onboarding flow is optimized for the already-burned developer. The compliance/enterprise buyer needs full governance depth visible and documented before deciding — a structured audit report (`arch audit --report`) covering rule inventory, chronicle summary, and enforcement separation attestation.

**Direction:** `arch audit --report` generating a SOC2-adjacent structured compliance report in human-readable Markdown and machine-readable JSON. Requires chronicle normal-path coverage and generated-docs coupling to produce meaningful output.

**Gap preventing graduation:** Two hard dependencies unmet: (1) chronicle normal-path emit (IDEA-chronicle-govern-coverage), (2) governance rule inventory coupled to enforced state (IDEA-generated-docs-coupling). Cannot audit what hasn't shipped.
