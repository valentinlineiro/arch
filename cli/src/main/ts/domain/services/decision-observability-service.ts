import { Decision, DecisionStatus, DecisionImpact } from '../models/decision.js';
import { EvidenceEvent } from '../models/evidence.js';

export class DecisionObservabilityService {
  /**
   * Maps EvidenceEvents to a Decision to determine its status.
   */
  evaluate(decision: Decision, relatedEvidence: EvidenceEvent[]): { status: DecisionStatus; evidenceIds: string[] } {
    if (relatedEvidence.length === 0) {
      return { status: 'INSUFFICIENT_EVIDENCE', evidenceIds: [] };
    }

    const evidenceIds: string[] = [];
    let contradictionCount = 0;

    for (const event of relatedEvidence) {
      if (this.isContradiction(decision, event)) {
        contradictionCount++;
      }
      evidenceIds.push(event.id);
    }

    // Threshold-based status (could be more sophisticated)
    const status = contradictionCount > 0 ? 'CONTRADICTED' : 'SUPPORTED';
    
    return { status, evidenceIds };
  }

  /**
   * Calculates the organizational impact of a decision drift.
   */
  calculateImpact(decision: Decision, driftEvidence: EvidenceEvent[]): DecisionImpact {
    // Risk score = base impact * volume of drift evidence
    const baseWeights = { HIGH: 50, MEDIUM: 20, LOW: 5 };
    const volumeModifier = Math.min(driftEvidence.length * 5, 50);
    
    const riskScore = Math.min(baseWeights[decision.impact] + volumeModifier, 100);

    return {
      decisionId: decision.id,
      riskScore,
      driftProbability: driftEvidence.length / 10, // Placeholder heuristic
      remediationCost: decision.impact, // Often correlated
      businessRisk: this.generateBusinessRiskProse(decision, driftEvidence)
    };
  }

  private isContradiction(decision: Decision, evidence: EvidenceEvent): boolean {
    // Logic depends on DecisionType
    switch (decision.type) {
      case 'OWNERSHIP':
        // If decision says owner is Team A, but commit is by Team B (without approval)
        return evidence.claim.relation === 'OWNERSHIP' && evidence.claim.object !== decision.intendedState.owner;
      
      case 'PROCESS':
        // If decision says "Must have link", but evidence is a commit with no LINKAGE claim
        return evidence.claim.relation === 'LINKAGE' && !evidence.claim.object;

      case 'ARCHITECTURAL':
        // If decision says "Module A should not depend on B", but evidence shows a MODIFICATION crossing that boundary
        // (This requires a more complex check against the graph projection)
        return false;

      default:
        return false;
    }
  }

  private generateBusinessRiskProse(decision: Decision, driftEvidence: EvidenceEvent[]): string {
    if (driftEvidence.length === 0) return 'No immediate business risk detected.';
    
    return `The ${decision.type} decision "${decision.title}" is being bypassed. ` +
           `Detected ${driftEvidence.length} instances of contradictory behavior. ` +
           `This increases structural debt in ${decision.subject}.`;
  }
}
