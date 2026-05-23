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
