# ARCH Protocol Upgrade Policy

> **Anchored to:** repo state as of 2026-05-18 (`v0.6.0`)
> **Purpose:** Define how a repo governed by ARCH should adopt new ARCH versions without creating hidden governance drift.
> **Status:** Planning policy. Not canonical until promoted into guideline / ADR form.

---

## Core Principle

**An ARCH upgrade is governed change, not tooling churn.**

If a repo is operated under ARCH, then changing the ARCH version changes the repo's operating system:
- task format expectations
- command surface
- drift checks
- migration rules
- human / agent authority boundaries

That change must be introduced explicitly through the repo's own task system. Silent upgrades are governance drift.

---

## Upgrade Invariant

An ARCH upgrade is valid only when these four surfaces are brought back into agreement:

1. **Installed / invoked ARCH version**
2. **Protocol docs in the governed repo**
3. **Enforcement behavior** (`arch review`, command dispatch, validators, checkers)
4. **Corpus state** (tasks, archive, ADRs, config, habits)

If one surface changes and the others do not, the repo enters an ambiguous authority state. That is an upgrade failure even if the CLI still runs.

---

## Compatibility Classes

Use three upgrade classes.

### 1. Patch

**Definition:** Clarification, bugfix, token reduction, checker correction, or non-breaking implementation cleanup.

**Expected impact:**
- no task-format migration
- no lifecycle semantic change
- no new required fields
- no command removals

**Default process:** one evaluation task and one apply task may be enough.

**Examples:**
- fixing a false-positive checker
- tightening a parser without changing the task contract
- documentation clarification with no new obligation

### 2. Minor

**Definition:** New commands, optional fields, deprecations, new checks, or compatible workflow expansion.

**Expected impact:**
- new capabilities may appear
- old names may remain as aliases
- deprecation windows may begin
- docs/help likely need refresh

**Default process:** evaluation task + migration task + post-upgrade validation.

**Examples:**
- adding a new subcommand family
- introducing deprecation warnings for old verbs
- adding optional structured fields or new review checks

### 3. Major

**Definition:** Any change that alters task format, protocol semantics, authority boundaries, or compatibility assumptions.

**Expected impact:**
- migration guide required
- explicit human approval required
- may require ADR coverage before adoption

**Examples:**
- changing meta-line schema
- changing who may archive / approve / promote
- removing compatibility aliases without prior deprecation path
- redefining enforcement vs analysis boundaries

---

## Required Upgrade Flow

Every governed repo should process ARCH upgrades through explicit work.

### Step 1. Detect

Open an evaluation task:

`TASK-XXX: evaluate ARCH upgrade vA.B.C -> vX.Y.Z`

This task exists to answer:
- what changed?
- what compatibility class is it?
- what repo artifacts are affected?
- should this repo adopt now, defer, or reject?

### Step 2. Classify

Read release notes / changelog and classify the upgrade as:
- `PATCH`
- `MINOR`
- `MAJOR`

If classification is uncertain, default upward:
- uncertain patch/minor → treat as minor
- uncertain minor/major → treat as major

### Step 3. Impact Review

Check at least:
- `CHANGELOG.md`
- migration notes
- command aliases / removals
- `arch.config.json` expectations
- task format / archive format implications
- review checker behavior changes

### Step 4. Decide

One of three outcomes:

- **ADOPT NOW**
  The repo performs the migration in this session or release cycle.

- **DEFER**
  The repo remains pinned on its current ARCH version intentionally.
  The deferral must name the blocker and the event that will trigger reconsideration.

- **REJECT**
  The repo will not adopt this upgrade because it conflicts with the repo's operating model or timing constraints.

### Step 5. Apply Through Tasks

If adopted, open the implementation task(s):
- patch: usually one task
- minor: often one migration task + one doc cleanup task
- major: possibly ADR + migration task + corpus backfill task

### Step 6. Validate

After applying the upgrade, run:
- `arch review`
- representative workflow smoke test
- any migration-specific checks called out by the upgrade

For example:
- task start / done flow
- archive validation
- report generation
- command alias behavior

---

## Pinning Policy

A governed repo should have a clear, discoverable statement of its ARCH compatibility state:

- current adopted ARCH version
- whether it is intentionally behind latest
- whether a migration is in progress

This can live in one of:
- a planning doc
- a migration task
- a version ledger if one is later introduced

The important property is not location. It is **clarity**.

Unknown version state is governance drift.

---

## Backward Compatibility Rules

To keep governed repos stable:

1. **Prefer additive change**
   New commands and fields should arrive before old ones are removed.

2. **Use explicit deprecation windows**
   If a public command or format is being retired, emit warnings first and state the removal condition clearly.

3. **Require migration guides for semantic breaks**
   If humans or agents must behave differently after the upgrade, a migration guide is not optional.

4. **Do not hide breaking governance changes inside implementation fixes**
   A checker fix is patch-level only if it does not redefine the governing rule.

5. **Protect governed repos from surprise enforcement**
   A new warning class may be minor. A new blocking failure mode is usually major in operational impact even if the code diff is small.

---

## Failure Modes

These are the upgrade patterns to avoid.

### 1. Tool-first upgrade

The CLI is upgraded, but repo docs and corpus are not.

**Result:** the command enforces rules the repo never adopted.

### 2. Doc-first upgrade

The docs are updated, but enforcement behavior stays old.

**Result:** the repo claims rules that do not actually exist.

### 3. Checker-first surprise

New drift checks appear without migration work.

**Result:** the repo accumulates warnings or failures that look like team mistakes but are actually protocol mismatch.

### 4. Silent semantic change

The upgrade is labeled as small, but changes authority boundaries or workflow meaning.

**Result:** humans lose track of who is allowed to decide what.

---

## Operational Recommendations

### Safe default by class

- **Patch:** adopt quickly if `arch review` and smoke tests pass
- **Minor:** batch into a planned maintenance task
- **Major:** require explicit human approval and migration plan

### What should block adoption

Do not adopt immediately if the upgrade would:
- invalidate archived corpus semantics
- change task lifecycle meanings
- break existing command habits without alias path
- introduce warnings that the repo cannot realistically clear in the same migration window

### What should not block adoption

Do not inflate upgrade cost for:
- pure parser/checker correctness fixes
- documentation clarifications with no new obligation
- compatibility aliases that reduce friction

---

## Suggested Task Shapes

### Patch evaluation

`TASK-XXX: evaluate ARCH patch upgrade v0.6.0 -> v0.6.1`

AC examples:
- changelog reviewed
- no format or authority changes found
- adoption decision recorded

### Minor migration

`TASK-XXX: adopt ARCH minor upgrade v0.6.0 -> v0.7.0`

AC examples:
- deprecated command paths mapped
- docs updated to canonical verbs
- `arch review` passes
- smoke test covers daily workflow

### Major migration

`TASK-XXX: migrate governed repo to ARCH v1.0.0 protocol`

AC examples:
- migration guide reviewed
- ADR written or explicit approval recorded
- corpus backfill completed
- post-migration review green

---

## Decision Rule

When in doubt:

**Upgrade slower than tools, but faster than drift.**

Do not chase every release immediately.  
Do not let the governed repo drift so far from current ARCH that migration becomes constitutional surgery.

The right pace is deliberate, explicit, and auditable.
