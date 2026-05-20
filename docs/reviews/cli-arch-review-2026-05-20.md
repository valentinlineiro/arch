# CLI Architectural Review — 2026-05-20

**Scope:** `cli/src/main/ts/` — all layers (application/domain/infrastructure)  
**Produced by:** TASK-968  
**Reference ADR:** ADR-016 (domain layer semantic boundary)

---

## 1. Boundary Violation Map

### V1 — Upward Dependencies: Domain → Application (4 files)

Domain services that import types from `application/use-cases/` violate the declared layer order. Even type-only imports establish a semantic dependency the compiler cannot enforce — a future maintainer may add a value import without noticing.

| File | Line | Import |
|------|------|--------|
| `domain/services/governance-drift-detector.ts` | 1 | `import type { CorpusEntry } from '../../application/use-cases/corpus-index.js'` |
| `domain/services/institutional-anomaly-tracker.ts` | 1 | `import type { CorpusEntry } from '../../application/use-cases/corpus-index.js'` |
| `domain/services/precedent-novelty-scorer.ts` | 1 | `import type { CorpusEntry } from '../../application/use-cases/corpus-index.js'` |
| `domain/services/signal-router.ts` | 1 | `import type { CausalSignalLog } from '../../application/use-cases/causal-signal-log.js'` |

**Root cause:** `CorpusEntry` and `CausalSignalLog` are defined as classes/types inside use-case files rather than domain models. Moving them to `domain/models/` would eliminate all four violations without any logic change.

---

### V2 — Infrastructure in Domain Services (6 files, ADR-016 violation)

ADR-016 states domain services must have "no infrastructure dependencies." Six services import Node.js built-in modules directly, making them untestable without running actual processes or touching the real filesystem.

| File | node: modules imported | Severity |
|------|------------------------|----------|
| `domain/services/bridge-provider.ts` | fs, os, path, crypto, child_process | Critical |
| `domain/services/sandbox.ts` | vm, child_process, os, path | Critical |
| `domain/services/deterministic-ac-verifier.ts` | child_process (execSync), fs (existsSync) | High |
| `domain/services/deterministic-hansei-checker.ts` | child_process (execSync) | High |
| `domain/services/provider-registry.ts` | child_process (spawnSync) | High |
| `domain/services/archive-parser.ts` | path | Low |

`bridge-provider.ts` and `sandbox.ts` are the clearest cases: they own process spawning and file I/O. They belong in `infrastructure/services/` and should be injected via repository interfaces. The verifiers and checker use `execSync` to run shell predicates — also infrastructure operations.

`archive-parser.ts` uses only `path.dirname` for path manipulation, which is a minor case that could reasonably stay.

---

### V3 — Use-Case Importing Command (1 file)

`application/use-cases/govern-system.ts:10` imports `CorpusAuditCommand` directly:

```typescript
import { CorpusAuditCommand } from '../commands/corpus-audit-command.js';
```

Commands are meant to wire use-cases, not the reverse. This creates a dependency cycle risk and makes `govern-system` dependent on the command's concrete construction. The dependency should be inverted: `govern-system` should call a use-case that `corpus-audit-command` also calls, not the command itself.

---

### V4 — Output Formatter Imported by 11+ Commands

`infrastructure/cli/output-formatter.js` is directly imported by most command files. This is a pragmatic pattern (commands produce output) but it means every command is coupled to one specific formatting implementation. Not a violation per se, but it forecloses testability and future format changes.

---

### Command Wiring Summary

`index.ts` (462 lines) is the composition root. It:
- Instantiates all infrastructure adapters inline
- Wires all domain services inline
- Routes commands via a large switch statement

The switch statement means adding any command requires modifying `index.ts`. `command-registry.ts` (domain/services, 395 lines) exists as a single source of truth for command metadata but the composition root does not use it for routing — it is used only for help generation. These two structures are not linked.

---

## 2. Readability Audit

### 2a. Comment density

| File | Lines | Comment lines | Density | Signal |
|------|-------|---------------|---------|--------|
| `drift-checker.ts` | 1353 | 25 | 1.9% | Structurally compensated (method names carry intent) but check groupings are implicit |
| `govern-system.ts` | 563 | 38 | 6.8% | Adequate; workflow phases are documented |
| `task-command.ts` | 573 | 5 | 0.9% | Insufficient for a 13-sub-command dispatcher |
| `init-command.ts` | 654 | — | — | Not measured; large scaffolding command |
| `build-index.ts` | 492 | — | — | Not measured |

### 2b. Structurally necessary vs. structurally symptomatic comments

**Necessary comments** — present and justified:
- `drift-checker.ts` comments on Gate 3 (lines 209-210): "Skipped in review to avoid expensive npm run build execution" — explains a deliberate skip, not compensating for unclear code.
- `govern-system.ts` phase markers (workflow orchestration with multi-step side effects): necessary because the order of operations carries invariants that aren't expressible in types.

**Structural-confusion signals** — places where the *absence* of comments is a problem caused by unclear structure:
- `task-command.ts` contains 13 sub-command branches (start, create, edit, done, review, approve, reject, redirect, split, compress, reprioritize, rank, promote). No top-level navigation comment or sub-command grouping. The 573-line class with no comments forces readers to scan the entire file to locate a specific path.
- `drift-checker.ts` has 30 check methods in a single class. Each method name is descriptive but the grouping logic (why these checks run together, why some are async parallel vs. sequential) is invisible. The 1353-line file relies entirely on naming convention to signal its internal structure.

**Assessment:** The codebase has a low comment culture in general, which is fine for simple, well-named code. It breaks down at scale: the two largest files (drift-checker.ts, task-command.ts) are too large for naming alone to carry cognitive load.

---

## 3. Recommendation Set

### Direct Refactors (low-risk, bounded scope)

**R1. Move CorpusEntry and CausalSignalLog to domain/models/**  
Fixes V1 (4 upward dependencies) with no logic change. Extract the type from corpus-index.ts and causal-signal-log.ts into `domain/models/corpus-entry.ts` and `domain/models/causal-signal-log.ts`. Update all imports. Estimated size: XS.

**R2. Fix govern-system.ts → CorpusAuditCommand dependency**  
Identify what `govern-system` actually needs from `CorpusAuditCommand` (it calls `auditor.execute()` at line 110). Extract that logic into a use-case and have both govern-system and corpus-audit-command call the use-case. Eliminates V3. Estimated size: S.

**R3. Move archive-parser.ts path.dirname to a pure string operation**  
The single `path.dirname` call in `archive-parser.ts` can be replaced with a `.split('/').slice(0,-1).join('/')` or `lastIndexOf` operation, eliminating the node: import without moving the file. Estimated size: XS.

---

### Issues to Become Tasks

**T1. Move bridge-provider, sandbox, provider-registry to infrastructure/**  
These services own process spawning and file I/O and cannot be placed in domain per ADR-016. Migration requires: create corresponding interfaces in `domain/repositories/`, move implementations to `infrastructure/services/`, update all injection sites in `index.ts`. This is M-sized and needs care around the test surface (sandbox has dedicated tests). Creates path: `infrastructure/services/bridge-provider.ts`, `infrastructure/services/sandbox-runner.ts`.

**T2. Move deterministic-ac-verifier and deterministic-hansei-checker to infrastructure/**  
Both use `execSync` to run shell commands. Pattern is identical to bridge-provider. Can follow the same migration pattern as T1 once the interface is established. S-sized.

**T3. Decompose drift-checker.ts into check classes**  
1353 lines with 30 check methods is a maintenance liability. Each check (e.g., `checkCommandDrift`, `checkExcisionStructuralCheck`) is already self-contained — extracting each into its own class in `application/use-cases/checks/` is mechanical. The master `DriftChecker.check()` becomes a composed runner. L-sized; high value but non-urgent.

**T4. Add navigation structure to task-command.ts**  
The 13-sub-command dispatcher needs either: (a) decomposition into sub-command classes with a router, or (b) at minimum, clear section headers and a top-of-file command index. Option (a) is better but M-sized. Option (b) is XS and provides immediate relief.

---

### Acceptable Debt

**D1. output-formatter.js in commands**  
Commands producing formatted output and importing the formatter directly is pragmatic. The alternative (injecting a formatter interface) adds boilerplate without meaningful test isolation benefit, since command output is tested via integration tests anyway. Document as intentional: commands are thin presentation wrappers; they may import presentation infrastructure.

**D2. command-registry.ts in domain/services/**  
The registry is pure metadata (no node: imports, no infrastructure knowledge). Its placement in domain is defensible because it defines the contract surface of the CLI — which is a domain concept. Keeping it there is acceptable if it stays pure.

**D3. index.ts size (462 lines)**  
The composition root being large is a common trade-off in DI-without-framework setups. As long as it remains pure wiring (no business logic), its size is acceptable. The disconnect between command-registry routing and index.ts switch is low-priority: they serve different concerns (help/visibility vs. instantiation).

**D4. govern-system.ts size (563 lines)**  
The multiple workflows bundled here (archive, replenishment, conduct, focus) reflect the fact that governance is inherently multi-concern. Decomposing would require interfaces between the sub-workflows that don't currently exist. Acceptable as-is unless a specific workflow becomes a maintenance hotspot.

---

## Summary

| Category | Count | Highest severity |
|----------|-------|------------------|
| Boundary violations | 4 types (V1–V4) | V2 (ADR-016 violation, 6 files) |
| Readability issues | 2 | task-command.ts 0.9% density on a 573-line dispatcher |
| Direct refactors | 3 (R1–R3) | R1 (no-logic-change, fixes 4 upward deps) |
| Tasks to create | 4 (T1–T4) | T1/T2 (infrastructure migration, ADR-016) |
| Acceptable debt | 4 (D1–D4) | D1 (output-formatter pattern) |

The most actionable finding is V2/T1-T2: six services in `domain/services/` have direct infrastructure dependencies that ADR-016 explicitly prohibits. The fix path is clear (move + inject via interface) and the test coverage makes regressions detectable.
