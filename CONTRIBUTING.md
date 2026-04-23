# CONTRIBUTING.md

ARCH improves through use. The only valid source of changes is **observed friction in real projects** — not speculation, not best practices cargo-culted from elsewhere.

---

## The one rule

**No change without evidence.**

Every PR must reference a real situation where the current framework produced a worse outcome than the proposed change would. A task-ID from a real project, a retro finding, a pattern detected across sprints. Opinion without evidence is noise.

---

## How to contribute

### 1. Discover
Use ARCH in a real project. When something doesn't work as expected — a protocol is ambiguous, a token budget is wrong, an agent produces poor output — note it.

### 2. Propose
Open `docs/REFINEMENT.md` in this repo and add a draft:

```markdown
## [Short title]
**Source:** [Project name or context where you found this]
**Type:** PATCH | MINOR | MAJOR
**Status:** DRAFT

### What happened
[Specific situation — what you expected vs. what occurred]

### Proposed change
[Exact change to which file, with before/after if possible]

### Impact
[Who is affected, what breaks if anything]
```

### 3. Refine
Run the REFINE agent on your proposal. Include its output in the PR.

### 4. PR
- Title format: `[patch|feat|breaking] short description`
- Body: link to REFINEMENT.md entry + REFINE agent output
- Target branch: `main` for patches, `next` for minor/major

---

## What gets accepted

```
✅  Protocol change backed by 2+ real retro findings
✅  Token reduction that maintains agent output quality
✅  New agent for a clearly defined, recurring work type
✅  Routing update based on real CLI performance data
✅  Migration guide for a breaking change

❌  Generic "best practice" additions without project evidence
❌  New task classes without a real routing use case
❌  Instruction bloat that increases token cost without clear benefit
❌  Changes to BACKLOG/SPRINT/DONE format without migration path
```

---

## Versioning impact

Before submitting, declare the version impact in your PR:

| Change type | Version bump | Migration required |
|-------------|-------------|-------------------|
| Task format change | MAJOR | Yes — provide migration guide |
| New agent protocol | MINOR | No |
| New task class in ROUTING | MINOR | No |
| Instruction improvement | PATCH | No |
| Token reduction | PATCH | No |
| Bug fix in protocol | PATCH | No |

---

## The files you can change

```
SAFE TO CHANGE (framework files)
  docs/agents/          ← protocols
  docs/ROUTING.md       ← routing rules
  docs/GUIDELINES.md    ← CORE section only
  docs/adr/             ← templates

NEVER CHANGE IN A PR (project state files)
  docs/BACKLOG.md       ← template only, not content
  docs/SPRINT.md        ← template only
  docs/DONE.md          ← template only
  docs/DISPATCH.md      ← generated, never hand-edited
```

---

## ARCH runs on ARCH

This repo uses ARCH to manage its own development. The backlog for framework improvements lives in `docs/BACKLOG.md`. Sprints are tracked in `docs/SPRINT.md`. Retrospectives inform `docs/GUIDELINES.md`. If something in the process feels broken, that's a signal — open a REFINEMENT draft.
