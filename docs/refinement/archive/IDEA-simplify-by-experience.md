## IDEA-simplify-by-experience
**Type:** simplification | **Source:** Kaizen 2026-04-27 | **Priority:** P2 | **Status:** DECIDED

### Observation
Recent bugs exposed systemic weaknesses:
1. **Config drift**: arch.config.json paths wrong, review passed anyway
2. **Stale ACs**: TASK-037, 044 had unchecked ACs after "completion"
3. **Version drift**: AGENTS.md v0.3 vs config v0.4 vs CLI
4. **Reviewer gaps**: Doesn't validate paths exist

### Root Cause Analysis
ARCH accumulated features without defensive checks. The "trusted" stance (assume correct) failed.

### Simplification Proposal

#### 1. Kill dead paths in config
- Remove `sprint`, `backlog`, `done` — they're directory-based now
- Config should match reality, not legacy structure

#### 2. Add path existence validation
- `arch review` must fail if configured paths don't exist
- This catches drift automatically

#### 3. Strict done criteria
- Auto-verify: all ACs checked before DONE status allowed
- Warn if Task file has unchecked `[]` boxes

#### 4. Simplify versioning
- Single source: arch.config.json version
- All other docs (AGENTS.md, CLI, ONBOARDING) reference config, not hardcoded
- Or: version in one place only (aggressive)

#### 5. Reduce ceremony
- Task Meta line already has size (S/M/L) — use it, not separate estimation
- Focus:yes implies sprint — no need for sprint file

### Decision
Implement systemic hardening to prevent drift. Focus on path validation and strict completion criteria.
PROMOTE -> TASK-058