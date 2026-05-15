# IDEA: Discipline as a Service (DaaS) — Vision
**Created:** 2026-05-15
**Source:** Usability reflection
**Status:** DRAFT
**Sessions:** 1
**Meta:** P1 | S | local | docs/refinement/

## Problem
ARCH v0.6 is a powerful governance protocol, but it is "hard to use" because it enforces high discipline through a manual, brittle markdown interface. Users spend cognitive energy on "documentation ceremony" (fixing meta lines, manually linking ADRs, writing structured Hansei) rather than on technical decisions.

## Vision
**Discipline as a Service (DaaS)** shifts the burden of protocol enforcement from the human's memory to the CLI's automation. The CLI becomes the "Discipline Layer," while the Markdown remains the "Source of Truth."

The system should:
1.  **Mechanize Manipulation:** Automate the editing of brittle metadata.
2.  **Accelerate Intent:** Move from "Thought" to "Tracked Task" in seconds.
3.  **Proactivate Memory:** Inject relevant history (ADRs/Hansei) exactly when it's needed (at task start).
4.  **Socratic Reflection:** Guide humans through Hansei instead of letting them "rubber-stamp" LLM drafts.

## Roadmap of DaaS Features
- [ ] **Feature 1: `arch task edit`** — Interactive metadata management.
- [ ] **Feature 2: `arch task create`** — Instant task scaffolding from intent strings.
- [ ] **Feature 3: `arch task start` (Memory Injection)** — Contextual ADR/Hansei injection into stdout.
- [ ] **Feature 4: `arch task done` (Socratic Wizard)** — Guided diagnostic loop for retrospection.
- [ ] **Feature 5: `arch explain`** — On-demand glossary and ontology help.

## Rationale
By reducing the friction of the "ARCH ceremony," we ensure the protocol is followed not because of human willpower, but because the CLI makes the correct path the easiest path.

## Session 1 Evaluation (2026-05-15)
Features 1–3 (task edit, task create, task start memory injection) are DONE as of 2026-05-15. Feature 4 (Socratic Wizard) has its own IDEA (IDEA-daas-hansei-wizard). Feature 5 (arch explain) has no IDEA yet. This document now functions as a tracking artifact for remaining DaaS scope. Human: decide whether to promote this as a tracking task for Feature 5 scope, or close it since sub-IDEAs exist for the remaining work.

## Decision
<!-- PROMOTE → TASK-XXX | REJECT: reason -->
