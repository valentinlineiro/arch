## IDEA-opt-in-project-registry
**Type:** feature | **Source:** Kaizen 2026-04-27 | **Priority:** P3

### Observation
No feedback loop from scaffolded repos back to ARCH. Can't detect convergence patterns — how many projects use each routing agent, what guidelines are popular, etc.

### Proposal
**Minimal registry** — JSON file in repo:
```json
{
  "version": "0.3.0",
  "routing": { ... },
  "guidelines": ["core", "bugs", "versioning"]
}
```

Published at `https://valentinlineiro.github.io/arch/registry.json`.

Users opt-in via:
- Checkbox in `arch-initializr.html` (default: off)
- Or CLI flag: `arch init --opt-in-telemetry`

**Privacy:** Hash-only (no PII), no auth required.

### Aggregate endpoint
`https://valentinlineiro.github.io/arch/registry/aggregate.json`:
```json
{
  "totalProjects": 142,
  "byAgent": { "claude-code": 89, "gemini": 34, "local": 19 },
  "byVersion": { "0.3.0": 120, "0.2.0": 22 }
}
```

### Technical
- `registry.json` generated at scaffold time
- Cron job or manual script aggregates (GitHub Actions every 24h)
- No backend — static JSON only

### Value
- Measurable convergence metric
- Informs roadmap decisions
- Low privacy impact (anonymized)