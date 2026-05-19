# External Experiment Protocol
<!-- ARCH Causal Validation Framework | v1.0.0 -->
<!-- Status: ACTIVE | Target: Non-ARCH-Internal Repositories -->

## 1. Objective
To demonstrate that ARCH interventions produce a statistically significant improvement in real-world engineering outcomes (Lead Time, Defect Rate, etc.) in environments not optimized for the ARCH model.

## 2. Subject Selection (Quarantine)
The pilot repository must meet the following "Blindness Criteria":
- **Zero Contamination:** No members of the ARCH development team may contribute to or influence the subject repository.
- **Structural Entropy:** The repository must show signs of "Drift" (e.g., legacy code, multiple contributors, lack of recent ownership records).
- **Independent Observability:** The repository must have its own established measurement of success (Jira velocity, CI lead time, etc.) before the experiment starts.

## 3. Phase 1: Passive Prediction (Observation)
**Duration:** 2 Sprints (min. 30 days).
**Mode:** `arch govern` runs in the background. No interventions are suggested to the team.
- **Goal:** ARCH must generate at least 3 falsifiable predictions based on detected drift.
- **Example Prediction:** "Divergence in Module X (Ownership Drift) will correlate with a 15% increase in Defect Rate in the next release."

## 4. Phase 2: Active Intervention (The Causal Test)
**Duration:** 2-4 Sprints.
**Mode:** `arch govern` active. Suggestions from `DecisionImpactEngine` are surfaced to the team via the `ActionGovernanceService`.
- **Constraint (Zero-Touch):** The ARCH model (weights, extractors, thresholds) is **frozen**. No "parching" or "tuning" is allowed to make the results look better.
- **Measurement:** Record the `AcceptanceRate` of ARCH actions.

## 5. Success Criteria (The Refutation Gate)
The experiment is successful only if:
1. **Acceptance:** The team accepts and executes > 50% of HIGH PRIORITY actions.
2. **Correlation:** An increase in the `AlignmentScore` corresponds to a measurable improvement in at least one `ExternalOutcome` metric.
3. **Falsification Check:** If `AlignmentScore` improves but `ExternalOutcomes` degrade, the experiment triggers a `Goodhart Refutation` and the ARCH model is considered failed for this environment.

## 6. Post-Mortem (Hansei)
Every external experiment must conclude with a formal Hansei, analyzing not just the repository but the **validity of the ARCH Meta-Protocol itself.**
