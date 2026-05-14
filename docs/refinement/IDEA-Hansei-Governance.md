## IDEA: Constitutional Hansei - From Narrative to Governance

**Context:** The current Hansei implementation is "narrative prose." It relies on the implementing agent's virtue to admit mistakes. It is often written post-hoc, leading to rationalization rather than diagnostic truth. It is treated as a "metrical footnote" rather than a "constitutional gate."

**Proposal:** Redesign Hansei as a structured diagnostic tool that feeds the ARCH causal graph and governance automated loops.

### 1. Mandatory Structured Format
Replace the 1-3 sentence prose with a mandatory schema. A task cannot move to `DONE` without a valid diagnostic Hansei.

```markdown
## Hansei
**Severity:** [H0-H3]
**Category:** [e.g., TypeHack, ContextWaste, LeakyAbstraction, DeferredTest, ProcessViolation]

**Decision:**
[The specific technical or process compromise made.]

**Constraint:**
[The pressure or missing info that forced the compromise (e.g., "P1 deadline," "Underspecified API").]

**Cost:**
[The specific debt or risk introduced (e.g., "Degraded type safety in Module X").]

**Forward Action:**
[Link to an IDEA, escalation, or specific cleanup task.]
```

### 2. Hansei Severity Levels
- **H0 (Cosmetic):** Minimal impact, cleanup not required.
- **H1 (Local Debt):** Localized technical debt; should be fixed in next relevant task.
- **H2 (Structural Friction):** Repeating issue; affects multiple tasks/agents. Triggers an `IDEA` for refactoring.
- **H3 (Constitutional Failure):** Violates ARCH principles or requires an ADR update. Triggers an immediate `ANDON_HALT` or `arch reflect`.

### 3. Real-time Capture (Hansei-Draft)
Agents must record compromises as they happen.
- During `IN_PROGRESS`, agents append `> [Hansei-Draft]: <observation>` to the task file.
- The final Hansei must be a distillation of these real-time signals.

### 4. Epistemological Audit
The `arch review` command (and the human Auditor) must verify not just code, but the **integrity of the Hansei**.
- If a reviewer finds a "hack" not declared in Hansei -> `REJECT`.
- Failure to declare debt is treated as a higher violation than the debt itself.

### 5. Automated Signal Routing
- `H2` and `H3` signals are automatically appended to `.arch/causal-signal.jsonl`.
- `arch report` aggregates Hansei categories to identify "Sytemic Friction" (e.g., "80% of tasks report [ContextWaste] in Module Y").

### Decision
(To be filled by human)
PROMOTE → TASK-XXX | REJECT | EXTEND
