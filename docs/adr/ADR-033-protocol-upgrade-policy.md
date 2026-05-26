# ADR-033: Protocol upgrade policy — patch/minor/major classification and adoption

**Date:** 2026-05-24
**Status:** Accepted
**Deciders:** Valen (human)
**Source:** TASK-1002 — protocol upgrade policy

## Context

ARCH CLI upgrades silently break repos. When v1.2 is installed on a repo that adopted v1.1, new governance checks fire without warning, task templates may have changed, and there is no adoption path other than manually reading release notes. This is the primary blocker for recommending ARCH to external teams.

## Decision

Adopt a three-tier version classification (Patch/Minor/Major) with proportional adoption cost:

- **Patch**: bug fixes only. No evaluation task. `archVersion` updated silently.
- **Minor**: new commands or checks. XS evaluation task. Team adopts at their pace.
- **Major**: breaking changes to format, Hansei schema, or governance gates. M evaluation task + new ADR required.

Introduce `arch.config.json.archVersion` as the repo's adopted protocol version. This is distinct from the installed CLI version and enables version skew detection.

Introduce `.arch/protocol-versions.jsonl` as the append-only audit trail for adoption decisions (Adopt/Defer/Reject).

Full policy specified in `docs/PROTOCOL-UPGRADES.md`.

## Consequences

- `arch review` will warn on CLI version delta against `archVersion` once detection is implemented
- `arch init --upgrade` (future S task) generates the evaluation task and updates `archVersion` on Adopt
- Teams can defer major upgrades without breaking their current governance — the repo pin is explicit and audited
- ARCH maintainers must classify each release as Patch/Minor/Major and include `BREAKING.md` for Major releases
- Repos on v1.2.0+ that have not adopted this policy are encouraged to retroactively append a single Adopt record
