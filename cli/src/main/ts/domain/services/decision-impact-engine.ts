import { ReconciledDecision } from '../models/reconciliation.js';
import { ImpactAction, ActionType, RemediationPlan } from '../models/action.js';
import { createHash } from 'crypto';

export class DecisionImpactEngine {
  /**
   * Translates the Organizational Truth Report into a prioritized Remediation Plan.
   */
  generateRemediationPlan(reconciledDecisions: ReconciledDecision[]): RemediationPlan {
    const actions: ImpactAction[] = [];

    for (const decision of reconciledDecisions) {
      const action = this.deriveAction(decision);
      if (action && action.type !== 'NO_ACTION') {
        actions.push(action);
      }
    }

    // Sort by priority (HIGH -> LOW)
    actions.sort((a, b) => {
      const weights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return weights[b.priority] - weights[a.priority];
    });

    return {
      timestamp: new Date(),
      actions,
      totalRiskReduction: this.calculatePotentialImprovement(actions)
    };
  }

  private deriveAction(decision: ReconciledDecision): ImpactAction | null {
    const id = createHash('sha256').update(`${decision.id}:${decision.reconciliationState}`).digest('hex').slice(0, 8);
    
    // Mapping Logic: Divergence State -> Action Type
    let type: ActionType = 'NO_ACTION';
    let description = '';
    let reason = '';

    switch (decision.reconciliationState) {
      case 'DIVERGENT':
        if (decision.type === 'OWNERSHIP') {
          type = 'UPDATE_CODEOWNERS';
          description = `Align CODEOWNERS for ${decision.subject} with observed behavior.`;
          reason = `Actual ownership diverged from ${decision.source.ref}.`;
        } else if (decision.type === 'PROCESS') {
          type = 'OPEN_PR_REVIEW';
          description = `Audit PRs in ${decision.subject} for protocol violations.`;
          reason = `High contradiction rate detected in current process.`;
        } else {
          type = 'SUGGEST_REFACTOR';
          description = `Review architectural drift in ${decision.subject}.`;
          reason = `Implementation no longer supports the declared architectural decision.`;
        }
        break;

      case 'EMERGENT_ONLY':
        type = 'CREATE_ADR';
        description = `Formalize "de facto" behavior in ${decision.subject} as an ADR.`;
        reason = `Consistent behavioral patterns detected with no supporting documentation.`;
        break;

      case 'STALE':
        type = 'DEPRECATE_DECISION';
        description = `Review and potentially archive stale decision: ${decision.title}.`;
        reason = `No evidence of this decision found in the repository for a significant period.`;
        break;

      case 'ALIGNED':
        return null;
    }

    return {
      id: `action:${id}`,
      type,
      priority: decision.impact,
      status: 'SUGGESTED',
      target: decision.subject,
      description,
      justification: {
        reason,
        evidenceIds: decision.divergenceEvidenceIds || []
      },
      metadata: {
        decisionId: decision.id,
        detectedAt: new Date()
      }
    };
  }

  private calculatePotentialImprovement(actions: ImpactAction[]): number {
    // Each High priority action might improve alignment score by ~5 points, etc.
    // Simplified heuristic.
    return actions.reduce((acc, action) => {
      const weights = { HIGH: 10, MEDIUM: 5, LOW: 2 };
      return acc + weights[action.priority];
    }, 0);
  }
}
