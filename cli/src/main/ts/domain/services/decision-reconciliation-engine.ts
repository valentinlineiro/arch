import { Decision, DecisionStatus } from '../models/decision.js';
import { ReconciledDecision, OrganizationalTruthReport } from '../models/reconciliation.js';
import { EvidenceEvent } from '../models/evidence.js';

export class DecisionReconciliationEngine {
  /**
   * Fuses Declared Decisions (ADR/Config) with Observed Behavior (Evidence)
   * to detect Organizational Divergence.
   */
  reconcile(
    declaredDecisions: Decision[],
    observedEvidence: EvidenceEvent[]
  ): OrganizationalTruthReport {
    const reconciled: ReconciledDecision[] = [];
    
    // 1. Map Evidence to Declared Decisions
    for (const declared of declaredDecisions) {
      const relatedEvidence = this.filterRelatedEvidence(declared, observedEvidence);
      const { status, evidenceIds } = this.evaluateDivergence(declared, relatedEvidence);
      
      reconciled.push({
        ...declared,
        source: { type: 'ADR', confidence: 1.0, ref: declared.metadata.source }, // Simplified
        status: status,
        reconciliationState: this.mapStatusToState(status, relatedEvidence.length),
        divergenceEvidenceIds: status === 'CONTRADICTED' ? evidenceIds : [],
        evidenceIds
      });
    }

    // 2. Detect "Emergent-only" decisions (Behavior with no ADR)
    // This requires pattern detection across evidence (e.g., all commits to /auth are by Team B, but no CODEOWNER says so)
    const emergent = this.detectEmergentDecisions(observedEvidence, declaredDecisions);

    return {
      timestamp: new Date(),
      alignmentScore: this.calculateAlignment(reconciled),
      topDivergences: reconciled.filter(r => r.reconciliationState === 'DIVERGENT'),
      unrecordedBehavioralPatterns: emergent
    };
  }

  private evaluateDivergence(decision: Decision, evidence: EvidenceEvent[]): { status: DecisionStatus, evidenceIds: string[] } {
    if (evidence.length === 0) return { status: 'INSUFFICIENT_EVIDENCE', evidenceIds: [] };
    
    const contradictions = evidence.filter(e => this.isContradiction(decision, e));
    const status = contradictions.length > (evidence.length * 0.2) ? 'CONTRADICTED' : 'SUPPORTED';
    
    return { status, evidenceIds: contradictions.map(c => c.id) };
  }

  private mapStatusToState(status: DecisionStatus, evidenceCount: number): 'ALIGNED' | 'DIVERGENT' | 'STALE' {
    if (status === 'INSUFFICIENT_EVIDENCE') return 'STALE';
    if (status === 'CONTRADICTED') return 'DIVERGENT';
    return 'ALIGNED';
  }

  private isContradiction(decision: Decision, evidence: EvidenceEvent): boolean {
    // Basic structural contradiction logic
    if (decision.type === 'OWNERSHIP' && evidence.claim.relation === 'OWNERSHIP') {
       return evidence.claim.object !== decision.intendedState.owner;
    }
    return false;
  }

  private detectEmergentDecisions(evidence: EvidenceEvent[], declared: Decision[]): Decision[] {
    // Placeholder for "Behavioral Pattern Detection"
    // e.g., if we see 50 LINKAGE events to a specific Issue area not covered by ADRs
    return []; 
  }

  private calculateAlignment(reconciled: ReconciledDecision[]): number {
    if (reconciled.length === 0) return 100;
    const aligned = reconciled.filter(r => r.reconciliationState === 'ALIGNED').length;
    return Math.round((aligned / reconciled.length) * 100);
  }

  private filterRelatedEvidence(decision: Decision, evidence: EvidenceEvent[]): EvidenceEvent[] {
    return evidence.filter(e => e.claim.subject === decision.subject);
  }
}
