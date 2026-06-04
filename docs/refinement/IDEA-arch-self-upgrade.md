# IDEA: arch self-upgrade

**Status:** DRAFT
**Submitted:** 2026-06-02
**Sessions:** 1

## Intent

When ARCH detects that the CLI is out of date (e.g., during `arch govern` or `arch status`), it should notify the operator and optionally self-upgrade without requiring a separate `arch upgrade` invocation.

## Problem

Currently the upgrade path is manual: the user must run `arch upgrade` explicitly. There is no ambient signal when a newer version is available — governance ticks, status checks, and session-start orientation all stay silent about version drift.

## Proposed behavior

1. **Passive check (non-blocking):** During `arch govern` (or `arch status`), if the installed CLI version is behind the latest published version on npm, emit a single advisory notice: `[upgrade available] @valentinlineiro/arch x.y.z → a.b.c — run arch upgrade`.
2. **Active flag (opt-in):** `arch govern --upgrade` or a config key `governance.autoUpgrade: true` triggers `arch upgrade` automatically after the governance tick completes (post-enforcement, not pre).
3. **Throttle:** Advisory should only fire once per 24 hours per terminal session — not on every govern tick.
4. **Version check is non-blocking:** If npm is unreachable, suppress the check silently (same behavior as current `arch upgrade` offline path).

## Open questions

- Should the version check run on every `arch govern` or only on `arch govern` with no subcommand?
- Is `autoUpgrade: true` too aggressive for CI environments that pin CLI versions? May need a `CI` env guard.
- Where does the 24h throttle state live — `.arch/alert-fatigue.jsonl` (reuse AlertFatigueStore) or a dedicated `.arch/upgrade-check.json`?

## Decision

_(pending)_
