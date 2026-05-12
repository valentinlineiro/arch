import { ReflectDecisionLog } from './reflect-decision-log.js';
import { ReflectProposalLog } from './reflect-proposal-log.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

export interface ReflectThresholds {
  minEngagementRate: number;
  maxUnobservedWithProposalRate: number;
  persistenceN: number;
}

export const DEFAULT_THRESHOLDS: ReflectThresholds = {
  minEngagementRate: 0.5,
  maxUnobservedWithProposalRate: 0.3,
  persistenceN: 3,
};

export interface ThresholdViolation {
  rule: 'engagement' | 'observability_gap';
  message: string;
}

export interface InfluenceReport {
  corpus: number;
  engaged: number;
  unobserved: number;
  attribution: {
    cited: number;
    declaredIndependent: number;
  };
  proposalCoverage: {
    hadProposals: number;
    unprompted: number;
  };
  unobservedWithProposal: number;
  violations: ThresholdViolation[];
}

export class ReflectInfluenceReport {
  private decisionLog: ReflectDecisionLog;
  private proposalLog: ReflectProposalLog;

  constructor(fileSystem: FileSystem, rootPath: string) {
    this.decisionLog = new ReflectDecisionLog(fileSystem, rootPath);
    this.proposalLog = new ReflectProposalLog(fileSystem, rootPath);
  }

  async compute(thresholds: ReflectThresholds = DEFAULT_THRESHOLDS): Promise<InfluenceReport> {
    const [decisions, proposals] = await Promise.all([
      this.decisionLog.committed(),
      this.proposalLog.all(),
    ]);

    const proposalTargets = new Set(proposals.map(p => p.target));

    let engaged = 0;
    let unobserved = 0;
    let cited = 0;
    let declaredIndependent = 0;
    let hadProposals = 0;
    let unobservedWithProposal = 0;

    for (const d of decisions) {
      const hasProposal = proposalTargets.has(d.target);
      if (hasProposal) hadProposals++;

      if (d.influence_declared) {
        engaged++;
        if (d.based_on_proposals.length > 0) {
          cited++;
        } else {
          declaredIndependent++;
        }
      } else {
        unobserved++;
        if (hasProposal) unobservedWithProposal++;
      }
    }

    const violations: ThresholdViolation[] = [];
    const corpus = decisions.length;

    if (corpus > 0) {
      const engagementRate = engaged / corpus;
      if (engagementRate < thresholds.minEngagementRate) {
        violations.push({
          rule: 'engagement',
          message: `Engagement ${Math.round(engagementRate * 100)}% is below threshold ${Math.round(thresholds.minEngagementRate * 100)}% — attribution discipline review required`,
        });
      }

      const gapRate = unobservedWithProposal / corpus;
      if (gapRate > thresholds.maxUnobservedWithProposalRate) {
        violations.push({
          rule: 'observability_gap',
          message: `Unobserved-with-proposal rate ${Math.round(gapRate * 100)}% exceeds threshold ${Math.round(thresholds.maxUnobservedWithProposalRate * 100)}% — explicit audit note required`,
        });
      }
    }

    return {
      corpus,
      engaged,
      unobserved,
      attribution: { cited, declaredIndependent },
      proposalCoverage: {
        hadProposals,
        unprompted: corpus - hadProposals,
      },
      unobservedWithProposal,
      violations,
    };
  }

  static format(r: InfluenceReport, thresholds: ReflectThresholds = DEFAULT_THRESHOLDS): string {
    if (r.corpus === 0) {
      return [
        'REFLECT Influence Report',
        '─────────────────────────',
        '',
        'No committed decisions recorded yet.',
        'Corpus accumulates as THINK sessions execute human decisions.',
      ].join('\n');
    }

    const pct = (n: number, d: number) =>
      d === 0 ? '—' : `${Math.round((n / d) * 100)}%`;

    const engagementRate = r.corpus > 0 ? r.engaged / r.corpus : 0;
    const gapRate = r.corpus > 0 ? r.unobservedWithProposal / r.corpus : 0;

    const engagementOk = engagementRate >= thresholds.minEngagementRate;
    const gapOk = gapRate <= thresholds.maxUnobservedWithProposalRate;

    const lines = [
      'REFLECT Influence Report',
      '─────────────────────────',
      '',
      `Corpus: ${r.corpus} committed decision${r.corpus === 1 ? '' : 's'}`,
      '',
      'Engagement',
      `  ${pct(r.engaged, r.corpus)} engaged attribution explicitly (${r.engaged}/${r.corpus})`,
      `  ${pct(r.unobserved, r.corpus)} structurally unobserved — attribution not declared`,
      `  ${engagementOk ? '✔' : '✖'} threshold: ≥${Math.round(thresholds.minEngagementRate * 100)}% engagement${engagementOk ? '' : ' — attribution discipline review required'}`,
    ];

    if (r.unobserved > 0) {
      lines.push('');
      lines.push('  ⚠ Fidelity metrics below cover only the engaged portion.');
      lines.push('  Conclusions drawn from attribution alone are biased by non-participation.');
    }

    lines.push('');
    lines.push(`Attribution (${r.engaged} engaged decision${r.engaged === 1 ? '' : 's'})`);
    if (r.engaged === 0) {
      lines.push('  No engaged decisions — attribution breakdown unavailable.');
    } else {
      lines.push(`  cited proposals:       ${pct(r.attribution.cited, r.engaged)} (${r.attribution.cited}) — REFLECT credited`);
      lines.push(`  declared independent:  ${pct(r.attribution.declaredIndependent, r.engaged)} (${r.attribution.declaredIndependent}) — REFLECT explicitly not credited`);
    }

    lines.push('');
    lines.push('Proposal coverage (all committed decisions)');
    lines.push(`  REFLECT had proposals:   ${pct(r.proposalCoverage.hadProposals, r.corpus)} (${r.proposalCoverage.hadProposals})`);
    lines.push(`  REFLECT had nothing:     ${pct(r.proposalCoverage.unprompted, r.corpus)} (${r.proposalCoverage.unprompted}) — unprompted decisions`);

    if (r.unobservedWithProposal > 0 || !gapOk) {
      lines.push('');
      lines.push('Observability gap');
      lines.push(`  ${pct(r.unobservedWithProposal, r.corpus)} of decisions (${r.unobservedWithProposal}) had REFLECT proposals but no attribution declared.`);
      lines.push(`  ${gapOk ? '✔' : '✖'} threshold: ≤${Math.round(thresholds.maxUnobservedWithProposalRate * 100)}% unobserved-with-proposal${gapOk ? '' : ' — explicit audit note required'}`);
      if (!gapOk) {
        lines.push('  This is a structural gap — potential influence that cannot be measured.');
      }
    }

    if (r.violations.length > 0) {
      lines.push('');
      lines.push('Governance actions required');
      for (const v of r.violations) {
        lines.push(`  ✖ ${v.message}`);
      }
    }

    return lines.join('\n');
  }
}
