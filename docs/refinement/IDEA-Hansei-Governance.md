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
- **H0 (Observation):** Minimal impact, cleanup not required.
- **H1 (Local Debt):** Localized technical debt; should be fixed in next relevant task.
- **H2 (Structural Friction):** Repeating issue; affects multiple tasks/agents. **Requires Evidence:** ≥3 repeated occurrences. Triggers an obligatory `IDEA` for refactoring.
- **H3a (Blocking Invalidity):** Violates ARCH principles. Immediate rejection.
- **H3b (Escalated Risk):** Constitutional risk requiring Human Architect override with a mandatory **Expiry Task**.

### 3. Real-time Capture (Hansei-Draft)
Agents must record compromises as they happen.
- During `IN_PROGRESS`, agents append `> [Hansei-Draft]: <observation>` to the task file.
- The final Hansei must be a distillation of these real-time signals.

### 4. Epistemological Audit (Anti-Gaming)
The `arch review` command (and the human Auditor) must verify the **fidelity** of the Hansei.
- **Under-declaration:** Hidden debt -> `[AuditGap]`, Severity **H3a**.
- **Over-declaration (Inflation):** Defensive signaling/backlog bloat -> `[ProcessViolation]`.
- **Anti-Goodhart Principle:** The goal is accurate constitutional mapping, not defensive signaling.
- Failure to declare debt is treated as a higher violation than the debt itself.

### 5. Automated Signal Routing
- `H2` and `H3` signals are automatically appended to `.arch/causal-signal.jsonl`.
- `arch report` aggregates Hansei categories to identify "Systemic Friction" (e.g., "80% of tasks report [ContextWaste] in Module Y").

### Decision
(To be filled by human)
PROMOTE → TASK-XXX | REJECT | EXTEND
