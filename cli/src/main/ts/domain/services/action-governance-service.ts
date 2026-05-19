import { ImpactAction, ActionStatus, ActionFeedback } from '../models/action.js';
import { OrganizationalTruthReport } from '../models/reconciliation.js';

export interface GovernanceEfficiencyMetrics {
  acceptanceRate: number; // approved / suggested
  executionSuccessRate: number; // success / executed
  averageAlignmentBoost: number; // sum(alignmentImpact) / count(executed)
  topFrictionAreas: string[]; // Targets with high rejection rates
}

export class ActionGovernanceService {
  /**
   * Updates the status of an action based on human intervention.
   */
  adjudicate(action: ImpactAction, newStatus: ActionStatus): ImpactAction {
    return {
      ...action,
      status: newStatus,
      metadata: {
        ...action.metadata,
        resolvedAt: newStatus === 'EXECUTED' || newStatus === 'REJECTED' ? new Date() : undefined
      }
    };
  }

  /**
   * Closes the loop by recording the actual result of an executed action.
   */
  recordFeedback(action: ImpactAction, feedback: ActionFeedback): ImpactAction {
    if (action.status !== 'EXECUTED') {
      throw new Error('Feedback can only be recorded for EXECUTED actions.');
    }

    return {
      ...action,
      feedback
    };
  }

  /**
   * Computes the learning metrics to optimize future interventions.
   */
  calculateEfficiency(history: ImpactAction[]): GovernanceEfficiencyMetrics {
    const suggested = history.length;
    const approved = history.filter(a => a.status !== 'REJECTED' && a.status !== 'SUGGESTED').length;
    const executed = history.filter(a => a.status === 'EXECUTED');
    const successful = executed.filter(a => a.feedback?.result === 'SUCCESS');

    const totalBoost = executed.reduce((acc, a) => acc + (a.feedback?.alignmentImpact || 0), 0);

    return {
      acceptanceRate: suggested > 0 ? approved / suggested : 0,
      executionSuccessRate: executed.length > 0 ? successful.length / executed.length : 0,
      averageAlignmentBoost: executed.length > 0 ? totalBoost / executed.length : 0,
      topFrictionAreas: this.identifyFrictionAreas(history)
    };
  }

  private identifyFrictionAreas(history: ImpactAction[]): string[] {
    const rejectionCounts = new Map<string, number>();
    for (const action of history.filter(a => a.status === 'REJECTED')) {
      rejectionCounts.set(action.target, (rejectionCounts.get(action.target) || 0) + 1);
    }

    return Array.from(rejectionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([target]) => target)
      .slice(0, 5);
  }
}
