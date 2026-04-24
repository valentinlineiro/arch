## Documentation
- All framework files are Markdown — no YAML, no JSON, no special syntax
- **TASK-FORMAT.md** is the authoritative reference for the task format (v0.2+).
- Token budget must be declared or re-verified after any change to `docs/agents/`
- If a protocol change increases token cost, justify it explicitly in the PR
- ADRs are permanent — to reverse a decision, create a new ADR that supersedes
- **ADR-003** documents the explicit exception to ADR-001: DISPATCH output is ephemeral (terminal only, not committed)