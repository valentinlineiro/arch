
import type { Pattern, InferredArchitecturalPattern } from '../models/audit-inference.js';
import type { Decision } from '../models/decision.js';
import type { OrganizationalTruthReport } from '../models/reconciliation.js';

export interface RepositorySummary {
  healthScore: number;
  maturityLevel: 'EMERGENT' | 'STABILIZING' | 'ESTABLISHED';
  domainHealth: Record<string, { status: 'STABLE' | 'DRIFTING' | 'UNMAPPED'; score: number }>;
  topPatterns: string[];
  primaryDivergence?: string;
}

export class RepositorySummarizer {
  summarize(
    truthReport: OrganizationalTruthReport,
    patterns: Pattern[],
    inferredPatterns: InferredArchitecturalPattern[],
    decisions: Decision[]
  ): RepositorySummary {
    const healthScore = truthReport.alignmentScore;
    
    // Determine maturity level
    let maturityLevel: RepositorySummary['maturityLevel'] = 'EMERGENT';
    const stableCount = patterns.filter(p => p.stability === 'stable').length;
    if (stableCount >= 5 && decisions.length >= 10) {
      maturityLevel = 'ESTABLISHED';
    } else if (stableCount >= 2 || decisions.length >= 3) {
      maturityLevel = 'STABILIZING';
    }

    // Domain health mapping
    const domainHealth: RepositorySummary['domainHealth'] = {};
    const domains = new Set([...patterns.map(p => p.domain), ...decisions.map(d => d.subject)]);
    
    for (const domain of domains) {
      const pattern = patterns.find(p => p.domain === domain);
      const decision = decisions.find(d => d.subject === domain);
      
      let status: 'STABLE' | 'DRIFTING' | 'UNMAPPED' = 'UNMAPPED';
      let score = 0;

      if (pattern && decision) {
        status = pattern.stability === 'stable' ? 'STABLE' : 'DRIFTING';
        score = Math.round(pattern.stabilityScore * 100);
      } else if (pattern) {
        status = 'DRIFTING'; // No ADR for an observed pattern
        score = Math.round(pattern.stabilityScore * 80);
      } else if (decision) {
        status = 'UNMAPPED'; // ADR but no observed pattern
        score = 50;
      }

      domainHealth[domain] = { status, score };
    }

    const topPatterns = patterns
      .filter(p => p.stability === 'stable')
      .sort((a, b) => b.stabilityScore - a.stabilityScore)
      .slice(0, 3)
      .map(p => `${p.domain}:${p.dominantSignals[0]}`);

    const primaryDivergence = truthReport.topDivergences?.[0]?.title ?? 
                             truthReport.unrecordedBehavioralPatterns?.[0]?.subject;

    return {
      healthScore,
      maturityLevel,
      domainHealth,
      topPatterns,
      primaryDivergence,
    };
  }
}
