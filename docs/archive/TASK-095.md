## TASK-095: Opt-in project registry - scaffold and publish at init time
**Meta:** P3 | S | 5 | DONE | Focus:yes | 2-code-generation | claude | cli/src/, scripts/arch-init.sh
**Closed-at:** 2026-04-29T13:40:00Z

### Acceptance Criteria
- [x] `arch init` accepts an `--opt-in-telemetry` flag (default: off).
- [x] When opted in, a `registry.json` is generated in the repo root containing: a random UUID (generated once, stored in `.arch-local`), the `version` field from `arch.config.json`, and the `routing` map — no PII, no URLs, no domain names.
- [x] On `arch init` completion, if opted in, the registry entry is pushed to a known GitHub Pages endpoint via a simple HTTP POST to a GitHub Actions `repository_dispatch` event on the `arch` repo.
- [x] `.arch-local` is listed in `.gitignore` so the UUID is never committed.
- [x] `arch review` passes.

### Definition of Done
- [x] All ACs checked.
- [x] `arch review` passes.
