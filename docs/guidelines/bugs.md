# Bug & Hotfix Protocol

## What counts as a bug in ARCH

A bug is **any detected misalignment in the system**, including:

- WARNs reported by `arch check` (command drift, version drift, path drift)
- Inconsistencies between documentation and actual CLI behavior
- Broken references in `AGENTS.md` or other protocol files
- Tasks archived as DONE with unchecked ACs

## Bug flow

1. **Detection:** `arch check` or THINK mode identifies the misalignment.
2. **Registration:** The agent creates a bug task directly in `docs/tasks/` with `Focus:yes` — it bypasses the refinement queue.
3. **Priority:** Bugs always take precedence over feature tasks. Address before continuing development.
4. **Resolution:** Standard DO flow — IN_PROGRESS → implement → DONE → archive.

## Severity classification

| Level | Criteria | Example |
|-------|----------|---------|
| P0 | Blocking — prevents the agent from operating correctly | Broken path in AGENTS.md, `arch check` returns exit 1 |
| P1 | Functional degradation — system operates but with friction | Command documented in README but not implemented |
| P2 | Cosmetic / warn — does not affect operation | Minor format inconsistency |

## Relationship with `arch check`

Every WARN from `arch check` is a bug. When detected during THINK or DO, the agent creates the corresponding task in `docs/tasks/` with the appropriate severity.

P0 bugs are set to IN_PROGRESS in the same commit they are created.

## Poka-Yoke (Mistake-Proofing)

To prevent the recurrence of systematic errors, the following Poka-Yoke rule applies:

- **Enforcement Pipeline:** Any error pattern that appears 2+ times in `docs/KAIZEN-LOG.md` must have a corresponding deterministic check implemented in `arch check` before the pattern is considered resolved.
- **Exit Conditions:** A Kaizen entry is only "closed" when:
  1. An `arch check` check prevents the error from recurring.
  2. The pattern is explicitly accepted as a known trade-off with a documented rationale in `docs/KAIZEN-LOG.md`.

This ensures that protocol friction leads to deterministic hardening of the system.
