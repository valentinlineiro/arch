## TASK-095: Opt-in project registry - scaffold and publish at init time
**Meta:** P3 | S | READY | Focus:no | 2-code-generation | claude | cli/src/, scripts/arch-init.sh

### Acceptance Criteria
- [ ] `arch init` accepts an `--opt-in-telemetry` flag (default: off).
- [ ] When opted in, a `registry.json` is generated in the repo root containing: a random UUID (generated once, stored in `.arch-local`), the `version` field from `arch.config.json`, and the `routing` map — no PII, no URLs, no domain names.
- [ ] On `arch init` completion, if opted in, the registry entry is pushed to a known GitHub Pages endpoint via a simple HTTP POST to a GitHub Actions `repository_dispatch` event on the `arch` repo.
- [ ] `.arch-local` is listed in `.gitignore` so the UUID is never committed.
- [ ] `arch review` passes.

### Definition of Done
- [ ] All ACs checked.
- [ ] `arch review` passes.
