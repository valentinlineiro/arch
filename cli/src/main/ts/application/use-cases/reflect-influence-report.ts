import { ReflectDecisionLog } from './reflect-decision-log.js';
import { ReflectProposalLog } from './reflect-proposal-log.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';

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
}

export class ReflectInfluenceReport {
  private decisionLog: ReflectDecisionLog;
  private proposalLog: ReflectProposalLog;

  constructor(fileSystem: FileSystem, rootPath: string) {
    this.decisionLog = new ReflectDecisionLog(fileSystem, rootPath);
    this.proposalLog = new ReflectProposalLog(fileSystem, rootPath);
  }

  async compute(): Promise<InfluenceReport> {
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

    return {
      corpus: decisions.length,
      engaged,
      unobserved,
      attribution: { cited, declaredIndependent },
      proposalCoverage: {
        hadProposals,
        unprompted: decisions.length - hadProposals,
      },
      unobservedWithProposal,
    };
  }

  static format(r: InfluenceReport): string {
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

    const engagementRate = pct(r.engaged, r.corpus);
    const unobservedRate = pct(r.unobserved, r.corpus);
    const citedRate = pct(r.attribution.cited, r.engaged);
    const independentRate = pct(r.attribution.declaredIndependent, r.engaged);
    const hadProposalsRate = pct(r.proposalCoverage.hadProposals, r.corpus);
    const unpromptedRate = pct(r.proposalCoverage.unprompted, r.corpus);
    const gapRate = pct(r.unobservedWithProposal, r.corpus);

    const lines = [
      'REFLECT Influence Report',
      '─────────────────────────',
      '',
      `Corpus: ${r.corpus} committed decision${r.corpus === 1 ? '' : 's'}`,
      '',
      'Engagement',
      `  ${engagementRate} engaged attribution explicitly (${r.engaged}/${r.corpus})`,
      `  ${unobservedRate} structurally unobserved — attribution not declared`,
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
      lines.push(`  cited proposals:       ${citedRate} (${r.attribution.cited}) — REFLECT credited`);
      lines.push(`  declared independent:  ${independentRate} (${r.attribution.declaredIndependent}) — REFLECT explicitly not credited`);
    }

    lines.push('');
    lines.push('Proposal coverage (all committed decisions)');
    lines.push(`  REFLECT had proposals:   ${hadProposalsRate} (${r.proposalCoverage.hadProposals})`);
    lines.push(`  REFLECT had nothing:     ${unpromptedRate} (${r.proposalCoverage.unprompted}) — unprompted decisions`);

    if (r.unobservedWithProposal > 0) {
      lines.push('');
      lines.push('Observability gap');
      lines.push(`  ${gapRate} of decisions (${r.unobservedWithProposal}) had REFLECT proposals but no attribution declared.`);
      lines.push('  This is a structural gap — potential influence that cannot be measured.');
    }

    return lines.join('\n');
  }
}
