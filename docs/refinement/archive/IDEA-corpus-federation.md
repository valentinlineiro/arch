## IDEA: Automatic corpus federation on govern tick

**Status:** PROMOTED → TASK-1069
**Created:** 2026-05-28
**Source:** smartcart-os pilot retrospective — after 25 closed tasks in smartcart-os, `arch ask "price comparison patterns"` returned ARCH protocol history, not grocery optimizer learnings. The corpus import is manual (`arch corpus import`) and was never run during the pilot. The Hansei from TASK-008 contained genuine domain learning ("behavioral scoring adds no value over pure cost comparison for commodity grocery items") but lived only in the smartcart-os archive, invisible to other projects. The compounding value of inter-project learning was never realized.
**Candidate-class:** 2-code-generation
**Candidate-size:** M
**Depends:** none
**Sessions:** 1

---

## Problem

ARCH's corpus learning is project-local by default. Inter-project federation is supported (`arch corpus import`) but manual. Manual means it doesn't happen.

The timing problem compounds the gap: the learnings from a pilot are most valuable *during* the pilot. A Hansei capturing a domain insight on day 3 should inform task selection on day 4. A manual import step that requires remembering to run it after the sprint closes means the insight arrives months late, if at all.

The structural issue: `arch corpus import` treats federation as a batch operation (import once, reference later). It should be a streaming operation (pull delta on every govern tick). The difference is whether the corpus reflects yesterday's learnings or last quarter's.

In smartcart-os:
- TASK-008 closed with Hansei: domain learning about utility scoring
- No subsequent task could query that learning via `arch ask`
- The human had to manually recall the insight when designing TASK-009
- After 25 tasks, the corpus had no grocery domain knowledge despite 25 closures

---

## Proposed Fix

Add `corpus.remotes` to `arch.config.json`:

```json
{
  "corpus": {
    "remotes": [
      "https://github.com/valentinlineiro/smartcart-os",
      "https://github.com/valentinlineiro/some-other-project"
    ],
    "syncMode": "delta",
    "syncOnGovern": true
  }
}
```

When `syncOnGovern: true`, `arch govern` runs a corpus delta sync at the end of each tick:
1. For each remote, fetch the archive manifest (a lightweight index of archived task IDs and their Hansei digests)
2. Download only tasks whose Hansei digest has changed since last sync (delta, not full re-import)
3. Merge into the local corpus index

The sync is background/async — it does not block govern from completing. If the remote is unreachable, govern logs a warning and continues. Sync state is persisted in `.arch/corpus-sync.json` (last-synced timestamp and per-remote manifest hash).

**Local corpus is also auto-indexed:** Currently `arch corpus import` must be run manually even for the local project's own archive. Change: `arch govern` automatically indexes newly archived tasks from the local `docs/archive/` directory without requiring a manual import step.

**Privacy/access model:** Remotes are public GitHub repositories. No authentication is required for public repos. Private repos require a PAT stored in environment variable `ARCH_CORPUS_TOKEN`. The default is public-only.

---

## Why corpus federation is the highest-leverage improvement

The other four improvements in this retrospective series make individual tasks cheaper and safer. Corpus federation makes the system smarter over time. The value compounds: each project that closes tasks feeds the corpus for subsequent projects. Without it, every new project starts from zero regardless of prior work. With it, domain learnings propagate automatically within 24 hours of closure.

For ARCH itself (building ARCH): the protocol learnings from one session are already in the local corpus. For product codebases: the domain learnings from pilot A are invisible to pilot B unless federation runs.

---

## Acceptance Criteria

- [ ] `arch govern` with `syncOnGovern: true` syncs remote archive delta at tick end  →  prose: verified by configuring a remote and observing sync log in govern output
- [ ] Sync is delta-only — tasks already in local corpus are not re-fetched  →  prose: verified by running govern twice; second run shows "0 new tasks synced"
- [ ] Govern completes normally if remote is unreachable (non-blocking sync)  →  prose: verified by setting an invalid remote URL; govern logs warning and exits 0
- [ ] Local archive tasks are auto-indexed on govern without manual `arch corpus import`  →  prose: verified by closing a task and running arch ask — the closed task appears in results without running corpus import
- [ ] `corpus.remotes` absent from config causes no change to existing govern behavior  →  cmd: npm test --prefix cli; exit: 0
- [ ] `arch review` passes  →  cmd: arch review; exit: 0

---

## Decision

PROMOTE → TASK-1069

