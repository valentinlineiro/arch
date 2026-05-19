# ARCH Meta-Protocol
<!-- Evolutionary bounds for the ARCH Epistemic System -->
<!-- Status: DRAFT | Defined: 2026-05-19 -->

## 1. The Core Invariant of Evolution
ARCH is not a static governance engine; it is a living epistemological model of an engineering organization.

**The Invariant:** The system must be able to evolve its own definitions of reality (metrics, decision types, evidence sources) without breaking historical comparability. If a metric's definition changes, its past data must not be silently reinterpreted.

## 2. Meta-Governance Operations

These are the strict protocols for how ARCH changes its own mind.

### 2.1 Metric Introduction (The "Observation Window")
New external metrics (`OutcomeSource`) cannot be immediately used for `TruthCalibration`.
*   **Phase 1: Shadow Collection:** The metric is ingested but isolated from the `MeasurementGovernanceLayer`.
*   **Phase 2: Baseline Establishment:** ARCH must observe the metric for a minimum of 30 days (or 10 `TemporalSnapshots`) to establish a `VarianceScore`.
*   **Phase 3: Activation:** Only after baseline establishment can the metric influence the `AlignmentScore` calibration.

### 2.2 Decision Schema Evolution
Organizations invent new types of decisions. When the `DecisionType` taxonomy must expand:
*   **No Retroactive Reclassification:** Old decisions retain their original classification.
*   **Translation Layer:** A mapping function must be provided to explain how the old taxonomy relates to the new one for the `DecisionImpactEngine`.

### 2.3 Semantic Epochs (Handling Paradigm Shifts)
If an organization fundamentally changes how it works (e.g., migrating from Monolith to Microservices, or changing CI tools), the definition of "Lead Time" or "Module Containment" breaks.

*   **Epoch Transition Governance Rule:** 
    1. **Persistence:** A drift must persist for at least 3 consecutive snapshots before an Epoch Shift is proposed.
    2. **Cost:** Transitioning an epoch invalidates 100% of the `StabilityMetrics` history. The "System Stability" score is reset to 0.
    3. **External Confirmation:** An Epoch Shift REQUIREs an external event signal (e.g., a specific commit with a `paradigm-shift` tag or a manual human approval in the `ActionGovernanceService`).
*   **Isolation:** Comparisons of `AlignmentScore` or `ConvergenceRate` across Epoch Boundaries are strictly marked as `LOW CONFIDENCE`. The system starts a new baseline.

### 2.4 Extractor Layer Versioning
Extractors (e.g., `GitHubExtractor`) map external reality to internal `EvidenceEvent`s.
*   If an Extractor logic changes (e.g., how it parses PR linkages), it MUST increment its version.
*   The `ConfidenceModel` of an event must record the Extractor Version. A change in version triggers a re-evaluation in the `DecisionReconciliationEngine` to prevent artificial drift spikes.

## 3. Falsifiability Layer (Refutation Signals)
For ARCH to be a scientific system, it must be refutable. The system is considered "Falsified" and must enter `RESTRICTED_MODE` if any of the following signals occur:

### 3.1 The Goodhart Refutation
**Signal:** `AlignmentScore` increases by > 15% over a period, but **all** `ExternalOutcome` metrics (Lead Time, Defect Rate, etc.) degrade by > 10% in the same period.
**Meaning:** ARCH is optimizing for internal compliance while actively harming the engineering system. The model is flawed.

### 3.2 The Authority Decoupling
**Signal:** ARCH maintains a `StabilityScore` > 80, but the `AcceptanceRate` in the `ActionGovernanceService` drops below 30% for two consecutive periods.
**Meaning:** The system is "perfectly stable" in its own eyes, but has become irrelevant or wrong in the eyes of the humans.

### 3.3 The Evidence Decay Paradox
**Signal:** `CoverageRate` remains high (> 80%), but the `ConflictRecord` count increases by > 50% without triggering a Semantic Epoch.
**Meaning:** The system is "seeing everything" but its interpretation rules are clashing. The ontology is broken.

## 4. Restricted Mode
When a Refutation Signal is triggered:
- `ActionImpactEngine` is suspended (no new interventions).
- `MeasurementGovernanceLayer` is locked.
- The system emits a `SYSTEM_REFUTED` alert to the human INBOX, requiring a manual re-design of the underlying ontology or extractors.

## 5. Deprecation and Forgetting
A healthy epistemological system must be able to forget gracefully.
*   **Stale Evidence:** `EvidenceEvent`s older than the `Semantic Epoch` lose 50% of their confidence weight in the `DecisionReconciliationEngine`.
*   **Zombie Rules:** If a `Declared Decision` remains in a `STALE` state for > 90 days and the suggested `DEPRECATE_DECISION` action is repeatedly `DEFERRED`, the system automatically downgrades the Decision's `ImpactLevel` to `LOW`.

## 6. The Goal
This protocol ensures ARCH remains structurally sound even as the organization it governs completely changes its shape. ARCH survives by bounding its own uncertainty, not by enforcing brittle perfection.

