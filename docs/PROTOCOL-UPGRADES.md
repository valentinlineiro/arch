# ARCH Protocol Upgrade Policy
<!-- ADR-033 | Status: ACCEPTED | Effective: 2026-05-24 -->

This document defines how ARCH protocol upgrades are classified, communicated, and adopted. It is the authoritative reference for both ARCH maintainers and teams running ARCH on real projects.

---

## Version Classification

| Class | Version delta | Protocol changes | Adoption task required |
|-------|---------------|-----------------|----------------------|
| **Patch** | v1.x.y → v1.x.y+1 | None — bug fixes only | No |
| **Minor** | v1.x → v1.x+1 | New commands or checks added; existing behavior unchanged | XS evaluation task |
| **Major** | v1 → v2 | Breaking changes to task format, Hansei schema, or governance gates | M evaluation task + ADR |

---

## Adoption Protocol

When a repo detects a CLI version delta against its `arch.config.json.archVersion`:

### 1. Detection
`arch check` compares `arch.config.json.archVersion` against the installed CLI version on every run. Version mismatches emit a structured warning:

```
⚠ CLI version mismatch: repo expects v1.1.0, installed v1.2.0 (minor upgrade)
  Run: arch init --upgrade to evaluate the delta
```

### 2. Evaluation task creation
`arch init --upgrade` (S subcommand, to be implemented) generates a bounded evaluation task in `docs/tasks/` with size per classification:
- Patch: no task
- Minor: XS — run `arch check`, verify no failures, close
- Major: M — audit changed checks, update task templates, verify corpus compatibility

### 3. Adoption decision
The evaluation task closes with one of three Hansei outcomes:

| Outcome | Hansei Decision field | Effect |
|---------|----------------------|--------|
| **Adopt** | `Adopt: confirmed` | `archVersion` updated in `arch.config.json` |
| **Defer** | `Defer: <reason> until <condition>` | Repo pins current version, mismatch warning continues |
| **Reject** | `Reject: <reason>` | Repo pins current version, changelog consulted before next upgrade |

All outcomes appended to `.arch/protocol-versions.jsonl` for audit trail.

---

## `.arch/protocol-versions.jsonl` Schema

Append-only. Each record represents one adoption decision.

```json
{
  "decision_id": "PV-8char-uuid",
  "timestamp": "2026-05-24T10:00:00Z",
  "from_version": "1.1.0",
  "to_version": "1.2.0",
  "classification": "minor",
  "outcome": "Adopt | Defer | Reject",
  "rationale": "One-sentence reason",
  "evaluation_task": "TASK-XXX",
  "adopted_at": "2026-05-24T10:00:00Z"
}
```

**Invariant:** `decision_id` is globally unique. Records are never mutated — corrections are appended as supersession records with `supersedes: "PV-original-id"`.

---

## Breaking Change Communication

Major upgrades must include a `BREAKING.md` entry in the ARCH release with:
- Which task format fields changed
- Which governance gates changed behavior
- Migration path (explicit steps, not "see the diff")
- Whether existing archived tasks remain valid without migration

---

## Relationship to `archVersion` in `arch.config.json`

`arch.config.json.archVersion` records the protocol version the repo has formally adopted — not the CLI version installed. These can differ during evaluation periods. The field is written by `arch init --upgrade` on Adopt, never by `arch check` or `arch govern`.

---

## Current Version

ARCH CLI v1.2.0 — this policy is effective from v1.2.0 onward. Repos on earlier versions that upgrade to v1.2.0+ are encouraged (not required) to adopt this policy retroactively by appending a single record to `.arch/protocol-versions.jsonl` with `outcome: "Adopt"` and `rationale: "Retroactive adoption of upgrade policy"`.
