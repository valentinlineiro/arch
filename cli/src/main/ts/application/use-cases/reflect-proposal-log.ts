import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { ProposalType, ReflectProposal } from '../../domain/models/reflect-proposal.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

const PROPOSAL_PATH = `${PathResolver.from({}).archDir}/reflect-proposals.jsonl`;

export class ReflectProposalLog {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async append(params: {
    target: string;
    type: ProposalType;
    confidence: number;
    rationale_ref?: string;
    signals_used?: string[];
  }): Promise<ReflectProposal> {
    const proposal: ReflectProposal = {
      proposal_id: `THINK-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      target: params.target,
      type: params.type,
      confidence: params.confidence,
      rationale_ref: params.rationale_ref,
      signals_used: params.signals_used ?? [],
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${PROPOSAL_PATH}`, JSON.stringify(proposal) + '\n');
    return proposal;
  }

  async all(): Promise<ReflectProposal[]> {
    try {
      const raw = await this.fileSystem.readFile(`${this.rootPath}/${PROPOSAL_PATH}`);
      return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as ReflectProposal);
    } catch {
      return [];
    }
  }

  async forTarget(target: string): Promise<ReflectProposal[]> {
    const all = await this.all();
    return all.filter(p => p.target === target);
  }
}
