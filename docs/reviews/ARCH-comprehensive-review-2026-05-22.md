# ARCH Comprehensive Review — 2026-05-22

**Scope:** Full protocol audit — docs, CLI, governance model, team adoption path
**Method:** Read every root doc, agents/, guidelines/, TASK-FORMAT.md, GOVERNANCE.md, arch.config.json, CLI source, INBOX.md, .arch/ stores, KAIZEN-LOG.md, PRINCIPLES.md, 28 ADRs

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Protocol Findings & Contradictions](#2-protocol-findings--contradictions)
3. [File Audit & Simplification Plan](#3-file-audit--simplification-plan)
4. [CLI Surface Audit](#4-cli-surface-audit)
5. [IDEA Files Created](#5-idea-files-created)
6. [Value & Profitability Analysis](#6-value--profitability-analysis)
7. [Team Adoption Gap](#7-team-adoption-gap)
8. [Recommended Roadmap](#8-recommended-roadmap)

---

## 1. Executive Summary

ARCH is a sophisticated, production-quality protocol for coordinating AI agents in software engineering workflows. It has 342 completed tasks, 28 ADRs, and a 21,735-line TypeScript CLI implementing most of its protocol. It genuinely works for its intended use case: a single human + AI agent governing engineering work.

**The core tension:** ARCH is two products sharing one codebase — (1) an AI-agent coordination protocol and (2) a human-facing governance CLI. The protocol docs are designed for LLM consumption (philosophical, complete, reference-heavy). The CLI is well-engineered but has an LLM-oriented command surface. Neither is optimized for a human team joining cold.

**Key numbers:**

| Dimension | Count |
|-----------|-------|
| Root docs | 21 files |
| Stale/empty/removable | 6 files |
| CLI source files | 178 TypeScript files |
| CLI lines | 21,735 |
| Public commands | ~30 (4 namespaces) |
| Legacy deprecated aliases | 15+ |
| Active tasks | 31 |
| Archived tasks | 338 |
| READY tasks | 21 |
| ADRs | 28 |
| Active IDEAs | 6 |

---

## 2. Protocol Findings & Contradictions

### H1 — Hansei requirement contradiction (DO.md vs TASK-FORMAT.md vs AGENTS.md)

| File | Says | 
|------|------|
| `docs/agents/DO.md:20` | "always append Hansei, even on XS/S happy-path work" |
| `docs/TASK-FORMAT.md:146` | "XS/S: Hansei only when a trigger applies" |
| `docs/AGENTS.md` archiving § | "optional for XS/S unless a trigger applies" |

DO.md is out of sync with the other two. The triggered-only approach was deliberately designed (TASK-195, ADR-019). DO.md's deviation is the bug.

**Resolution:** `IDEA-resolve-hansei-contradiction.md` — harmonize DO.md to match spec.

### H1 — Meta line regex doesn't match documented field semantics

The authoritative regex at `TASK-FORMAT.md:220` ends with `(?<context>.+)$`. But:
- `Turns: N` is documented as appended after Context — the regex doesn't capture it
- `Locked-commit` is specified in AGENTS.md invariants but absent from TASK-FORMAT.md entirely
- Non-standard fields (`Actor:`, `Created-at:`) appear in real task files (TASK-975) with no spec coverage

**Resolution:** `IDEA-fix-meta-line-regex-and-fields.md` — update regex + document auxiliary fields.

### H2 — XL size has no Muri guard

`arch.config.json` defines Muri thresholds for XS/S/M/L only. The Meta regex accepts XL. `core.md` says XL "must be decomposed before READY" — but no mechanical guard prevents an XL task from entering IN_PROGRESS with unbounded turn/cost consumption.

**Resolution:** `IDEA-fix-config-gaps.md` — add XL Muri entry or enforce decomposition mechanically.

### H2 — models.md references non-existent config key

`docs/guidelines/models.md:13` documents `"modelTiers"` as the config schema. The actual `arch.config.json` uses `"strategies"` with a completely different nested structure. Documentation is stale.

**Resolution:** `IDEA-fix-config-gaps.md` — update models.md to match actual config.

### H2 — Locked-commit undocumented in TASK-FORMAT.md

The `Locked-commit` auxiliary provenance field is specified only in AGENTS.md invariants. TASK-FORMAT.md — the canonical format spec — doesn't mention it.

**Resolution:** Covered by `IDEA-fix-meta-line-regex-and-fields.md`.

### H3a — Escalations.jsonl deduplication storm

`.arch/escalations.jsonl` contains ~200 records with the same IDEA subjects appearing 5-10+ times under different `escalation_id` values. The protocol says "always append, never read" — which guarantees this duplication. The file is useless as a source of truth.

**Resolution:** `IDEA-fix-escalation-deduplication.md` — idempotency check before append.

---

## 3. File Audit & Simplification Plan

### Current structure: 21 root docs + 4 subdirectories

```
docs/                         21 files
├── agents/                    4 files (2 essential, 2 draft/design)
├── guidelines/                9 files (6 essential, 3 stale/duplicative)
├── adr/                      28 files (all essential as decision records)
├── archive/                 338 files (DONE tasks)
├── refinement/                6 active + ~150 archived IDEAs
├── course/                    4 files (educational)
├── templates/                 4 files (task templates)
├── tensions/                  8 files (pattern tracking)
├── reviews/                   1 file (this report + prior)
└── superpowers/              22 files (plans/ + specs/ — design history)
```

### Verdict per root doc

| File | Verdict | Action |
|------|---------|--------|
| `AGENTS.md` | ✅ Essential | Keep |
| `ARCH-CORE.md` | ✅ Essential | Keep |
| `EPISTEMIC-DOCTRINE.md` | ⚠️ Constitutional | Keep as separate file — merging into GOVERNANCE.md would dilute its standing |
| `EVENTS.md` | ❌ Stale | **Remove** — manual log, fully superseded by git log |
| `EXPERIMENT-PROTOCOL.md` | ❓ Aspirational | **Move** to `superpowers/plans/` |
| `GOVERNANCE.md` | ✅ Essential | Keep |
| `HALT-LOG.md` | ❌ Empty | **Remove** — empty file, HALT.md is canonical |
| `HALT.md` | ✅ Essential | Keep |
| `IDENTITY.md` | ✅ Essential | Keep |
| `INBOX.md` | ✅ Essential | Keep |
| `KAIZEN-LOG.md` | ✅ Essential | Keep |
| `META-PROTOCOL.md` | ❓ DRAFT, abstract, 0 inbound refs | **Remove** |
| `METRICS.md` | ✅ Essential | Keep (auto-generated) |
| `PRINCIPLES.md` | ✅ Essential | Keep |
| `PROTOCOL.md` | ✅ Essential | Keep |
| `RETRO.md` | ✅ Essential | Keep |
| `ROADMAP.md` | ✅ Essential | Keep |
| `SENTINEL-LOG.md` | ✅ Essential | Keep |
| `SPRINT-STATE-MACHINE.md` | ⚠️ Design doc | **Move** to `superpowers/specs/` |
| `TASK-FORMAT.md` | ✅ Essential | Keep (needs regex fix) |

### Verdict per subdirectory

| Subdirectory | Action |
|---|---|
| `agents/THINK-audit.md` | **Remove** — draft audit, findings should be in THINK.md |
| `agents/governance-execution-model.md` | **Move** to `superpowers/specs/` |
| `guidelines/models.md` | **Fix** — stale schema reference |
| `guidelines/resources.md` | **Archive** — gh cheat sheet, not protocol |
| `guidelines/what-ai-must-never-do-in-this-repo.md` | **Merge** into core.md |
| `superpowers/` (all) | **Move** to `archive/design/` |
| `refinement/archive/` | **Prune** — delete REJECTED/DEFERRED IDEAs older than 60 days |

### Target structure

```
docs/
├── AGENTS.md                  # Entry point
├── ARCH-CORE.md               # Execution contract
├── EPISTEMIC-DOCTRINE.md      # Constitutional frame
├── GOVERNANCE.md              # Decision matrix + Class I/II
├── HALT.md                    # Halt conditions
├── IDENTITY.md                # Frozen boundaries
├── INBOX.md                   # Human inbox
├── KAIZEN-LOG.md              # Learning log
├── METRICS.md                 # Auto-generated metrics
├── PRINCIPLES.md              # Distilled principles
├── PROTOCOL.md                # Version ledger
├── RETRO.md                   # Sprint retros
├── ROADMAP.md                 # Strategy
├── SENTINEL-LOG.md            # Preflight log
├── TASK-FORMAT.md             # Task format (canonical)
├── agents/
│   ├── DO.md
│   └── THINK.md
├── guidelines/
│   ├── core.md
│   ├── autonomy.md
│   ├── bugs.md
│   ├── documentation.md
│   ├── models.md (fixed)
│   ├── testing-a-change.md
│   └── versioning.md
├── adr/                       # 28 ADRs — all kept
├── archive/
│   ├── tasks/                 # DONE tasks
│   ├── design/                # superpowers/ design history
│   └── refinement/            # Rejected/archived IDEAs
├── refinement/                # Active IDEA files only
├── tensions/                  # Pattern tracking
├── templates/                 # Task templates
└── course/                    # Educational content
```

**Result:** Root docs reduced from 21 → ~15 (28% reduction). agents/ from 4 → 2 (50%). guidelines/ from 9 → 7 (22%).

---

## 4. CLI Surface Audit

### Scale

| Metric | Value |
|--------|-------|
| Source files | 178 `.ts` files |
| Total lines | ~21,735 |
| Architecture | Clean Architecture (application/use-cases/, domain/, infrastructure/) |
| Entry point | `cli/src/main/ts/index.ts` — 460-line monolithic switch statement |
| Command registry | `domain/services/command-registry.ts` — descriptive but used only for `--help` |
| Public commands | ~30 across 4 namespaces |

### Command surface

| Namespace | Commands | Audience |
|-----------|----------|----------|
| **Core** | `review`, `status`, `init`, `version` | Human + Agent |
| **Task Lifecycle** | `start`, `review`, `done`, `create`, `capture`, `edit`, `reprioritize`, `next`, `rank`, `promote`, `reject`, `approve`, `redirect`, `split`, `compress`, `hansei` | Agent (most), Human (some) |
| **Governance & Analysis** | `govern`, `govern inbox`, `govern reflect`, `govern serve`, `govern report`, `govern conduct`, `govern approve` | Agent (reflect, conduct), Human (inbox, serve, approve) |
| **Memory & Knowledge** | `memory ask`, `memory causal`, `memory index`, `memory explain`, `memory deps` | Agent |

### Problems found

| Issue | Detail |
|-------|--------|
| **Monolithic routing** | All command dispatch in a single 460-line `switch` statement in `index.ts`. Command registry exists but is not used for dispatch. |
| **15+ legacy aliases** | `validate`, `lint`, `next`, `rank`, `promote`, `loop`, `batch`, `drain`, `conduct`, `sandbox`, `mv`, `exec`, `merge-resolve`, `verify-acs`, `capture`, `inbox`, `reflect`, `report`, `ask`, `causal`, `index`, `explain`, `deps`, `approve` — all deprecated but still wired. ~50 lines of dead dispatch. |
| **LLM-oriented naming** | `govern reflect`, `memory causal show`, `compile` — philosophically consistent but unintuitive to human operators. |
| **No gradient of complexity** | `arch init` creates the full 50-file protocol. No `--lite` or `--minimal` mode. |
| **No `--help` per command** | `arch task --help` and `arch govern --help` don't work from reading index.ts (the fallback is the generic help text). |
| **No integration surface** | No `arch pr-check`, no `arch webhook`, no `arch ci-setup`. The CLI is terminal-only. |

### Recommended CLI changes

| Change | Impact | Effort |
|--------|--------|--------|
| Route through command registry instead of `switch` | Architectural hygiene | 2 days |
| Drop all legacy aliases at next MAJOR version | -50 lines, less confusion | 1 hour |
| Rename `govern reflect` → `analyze`, `memory causal show` → `trace` | Human UX | 1 hour |
| Add `arch task --help` / `arch govern --help` sub-help | Discoverability | 1 day |
| Add `arch ci-setup` for GitHub Actions | Onboarding | 2 days |
| Add `arch init --lite` (3-file install) | Team onboarding | 2 days |
| Promote `arch serve` (localhost:3000 dashboard) as default UX | Human visibility | 1 week |

---

## 5. IDEA Files Created

During this review, 5 IDEA files were created in `docs/refinement/`:

| File | Issue | Size | Status |
|------|-------|------|--------|
| `IDEA-resolve-hansei-contradiction.md` | DO.md vs TASK-FORMAT.md vs AGENTS.md — three different Hansei rules for XS/S | XS | DRAFT |
| `IDEA-fix-meta-line-regex-and-fields.md` | Regex missing `Turns:`, `Locked-commit` undocumented, non-standard fields in task files | S | DRAFT |
| `IDEA-fix-config-gaps.md` | XL missing from Muri thresholds, models.md references stale `modelTiers` key | S | DRAFT |
| `IDEA-fix-escalation-deduplication.md` | `.arch/escalations.jsonl` ~200 records with 5-10x duplication per subject | S | DRAFT |
| `IDEA-consolidate-arch-docs.md` | Master consolidation: remove 6 stale docs, merge 2 guidelines, move design history | M | DRAFT |

---

## 6. Value & Profitability Analysis

### Value today (earned)

| Asset | Value |
|-------|-------|
| **Deterministic governance** | `arch review` enforces rules (no merge commits, valid format, AC completion) that human teams rely on convention for. Rare and genuinely useful. |
| **Agent handover protocol** | DO/THINK split with INBOX.md escalations solves "agent finishes work and nobody knows" — a universal problem in AI-assisted repos. |
| **Decision traceability** | ADRs + Hansei + `.arch/` structured logs create an audit trail that survives context resets. |
| **Hansei ontology (H0-H3b)** | Structured machine-readable post-mortems are novel. The classification is useful for pattern detection. |

### Value gap (unrealized)

| Gap | Impact |
|-----|--------|
| **Single-player mode** | Protocol assumes one human + one agent. No multi-user, no team onboarding, no org adoption path. |
| **No onboarding UX** | `docs/course/` exists but requires reading ~50 files before being productive. Zero "value in 2 minutes." |
| **No integration surface** | No API, webhook, or CI/CD plugin. Terminal-only limits reach. |
| **CLI coupled to protocol** | The CLI repo lives in the same repo as the protocol corpus. Adopters must fork everything. |
| **No human dashboard** | `arch serve` exists (localhost:3000) but is not promoted as the primary UX. |

### Profitability paths

| Path | Effort | Revenue | Timeline |
|------|--------|---------|----------|
| **Consulting/training** — Onboard teams to ARCH methodology | Low | Services | Now |
| **Freemium CLI** — Free `arch`; paid `arch govern cloud` for multi-repo dashboards | Medium | Volume-based SaaS | 3-6 months |
| **Plugin marketplace** — Drift checkers, report generators, CI integrations | Medium | Per-plugin | 6 months |
| **Enterprise compliance** — Hansei + ADR trail as SOX-for-code-governance audit product | Medium | Per-seat | 6-12 months |
| **ARCH-as-a-Service** — Managed task board, multi-user workspaces, web UI | High | Subscription | 12 months |

**Highest-leverage first step:** Decouple the CLI from the protocol corpus. A standalone `arch init` that produces a 3-file protocol in any repo — not just yours — is the product. Everything else scales from there.

---

## 7. Team Adoption Gap

### Why teams can't adopt ARCH today

**1. No team primitives**
- No `assignee`, role, permission, or notification concept
- INBOX.md is a file in a repo — nobody reads it
- When a task needs review, the protocol says "a human Auditor" — but doesn't say *which* human or *how* they're notified

**2. No onboarding gradient**
- Path to productivity: read 50 markdown files + 28 ADRs + learn 30 CLI commands
- No `arch init --lite` that produces a working system in 2 minutes
- No progression from "basic task tracking" to "full AI governance"

**3. No integration surface**
- No GitHub Actions PR check
- No Linear/GitHub Issues sync
- No Slack/Teams/Discord webhooks
- No API for custom tooling

**4. Protocol complexity erodes trust**
- First encounter with `arch review` is often a meta-line formatting failure — feels like bureaucracy, not governance
- 28 ADRs and an epistemic doctrine document look like philosophy, not engineering
- The system doesn't explain *why* a check matters

**5. AI-agent dependency is a liability**
- If you remove the AI agent, ARCH becomes a markdown-based task tracker with git-enforced validation
- Useful, but not compelling enough to switch from Linear/GitHub Projects
- The value should stand without an agent

### What to ship for team adoption, in priority order

| # | Ship | Why | Effort |
|---|------|-----|--------|
| 1 | `arch init --lite` — 3-file install, `arch review` working in 2 minutes | Unlocks onboarding entirely | 2 days |
| 2 | `arch ci-setup` — installs GitHub Actions PR check for `arch review` | First visible value in CI | 2 days |
| 3 | Drop legacy CLI aliases, rename commands for humans (`govern reflect` → `analyze`, `memory causal` → `trace`) | Reduces cognitive overhead | 1 day |
| 4 | Add `assignee` to task meta, add Slack webhook for ANDON_HALT / REVIEW_REQUEST | Async team operations | 3 days |
| 5 | Promote `arch serve` as default UX — web dashboard as primary interface | Human visibility | 1 week |
| 6 | Archival cleanup — remove 6 stale docs, consolidate to ~15 root files | Cognitive load reduction | 2 days |
| 7 | Multi-human review routing — `arch govern inbox` sends notifications to assignees | Team primitive | 1 week |
| 8 | GitHub Issues sync — `arch task capture` creates a GitHub Issue; status syncs bidirectionally | Existing workflow integration | 1 week |

---

## 8. Recommended Roadmap

### Immediate (this week)
- [ ] Remove 6 stale root docs
- [ ] Consolidate `what-ai-must-never-do` into `core.md`
- [ ] Move `governance-execution-model.md` and `SPRINT-STATE-MACHINE.md` to `archive/design/`
- [ ] Remove `THINK-audit.md`

### Short-term (1-2 weeks)
- [ ] Fix Hansei contradiction in DO.md
- [ ] Fix Meta regex + document auxiliary fields
- [ ] Fix config gaps (XL Muri, models.md)
- [ ] Fix escalations deduplication
- [ ] Drop legacy CLI aliases

### Medium-term (1-2 months)
- [ ] `arch init --lite` — 3-file protocol install
- [ ] `arch ci-setup` — GitHub Actions PR check
- [ ] Rename LLM-oriented commands for human UX
- [ ] `arch serve` as default promoted UX
- [ ] Add `assignee` + Slack webhook

### Long-term (3-6 months)
- [ ] Team primitives (multi-human, roles, review routing)
- [ ] GitHub Issues / Linear sync
- [ ] Standalone CLI package decoupled from protocol corpus
- [ ] Plugin API for custom drift checks

---

## Appendix: Files referenced in this report

| File | Role |
|------|------|
| `docs/AGENTS.md` | Protocol entry point |
| `docs/ARCH-CORE.md` | Execution contract |
| `docs/GOVERNANCE.md` | Decision matrix |
| `docs/TASK-FORMAT.md` | Task format canonical spec |
| `docs/IDENTITY.md` | Frozen boundaries |
| `docs/INBOX.md` | Human inbox |
| `docs/EPISTEMIC-DOCTRINE.md` | Constitutional frame |
| `docs/PRINCIPLES.md` | Distilled principles |
| `docs/KAIZEN-LOG.md` | Learning log |
| `docs/METRICS.md` | Auto-generated metrics |
| `docs/ROADMAP.md` | Strategy |
| `docs/RETRO.md` | Sprint retros |
| `docs/PROTOCOL.md` | Version ledger |
| `docs/SENTINEL-LOG.md` | Preflight log |
| `docs/HALT.md` | Halt conditions |
| `arch.config.json` | System configuration |
| `docs/agents/DO.md` | Execution protocol |
| `docs/agents/THINK.md` | Analysis protocol |
| `docs/guidelines/core.md` | Core rules |
| `docs/guidelines/autonomy.md` | L-level definitions |
| `docs/guidelines/bugs.md` | Bug protocol |
| `docs/guidelines/models.md` | Model conventions (needs fix) |
| `docs/guidelines/versioning.md` | Versioning model |
| `.arch/escalations.jsonl` | Structured escalation store |
| `cli/src/main/ts/index.ts` | CLI entry point |
| `cli/src/main/ts/domain/services/command-registry.ts` | CLI command registry |
| `cli/package.json` | CLI package |
| `docs/refinement/IDEA-resolve-hansei-contradiction.md` | Created by this review |
| `docs/refinement/IDEA-fix-meta-line-regex-and-fields.md` | Created by this review |
| `docs/refinement/IDEA-fix-config-gaps.md` | Created by this review |
| `docs/refinement/IDEA-fix-escalation-deduplication.md` | Created by this review |
| `docs/refinement/IDEA-consolidate-arch-docs.md` | Created by this review |
