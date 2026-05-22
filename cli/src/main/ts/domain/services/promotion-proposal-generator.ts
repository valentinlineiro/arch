import fs from 'node:fs';
import path from 'node:path';
import type { PromotionProposal, ProposalAc, NoveltyInfo, UncertaintyEntry } from '../models/promotion-proposal.js';
import { PrecedentNoveltyScorer, type TaskDescriptor } from './precedent-novelty-scorer.js';
import { CorpusIndexService } from '../../application/use-cases/corpus-index.js';
import { NodeFileSystem } from '../../infrastructure/filesystem/node-file-system.js';

const CLASS_TEMPLATES: Record<string, Array<{ desc: string; predicate: string }>> = {
  '2-code-generation': [
    { desc: 'Implementation file exists at declared context path', predicate: 'file: (path)' },
    { desc: 'Tests pass', predicate: 'cmd: npm test; exit: 0' },
    { desc: 'arch check passes', predicate: 'cmd: arch check; exit: 0' },
  ],
  '6-writing': [
    { desc: 'Document created at declared path', predicate: 'file: (path)' },
    { desc: 'Content is accurate and complete', predicate: 'prose: reviewed and verified' },
    { desc: 'arch check passes', predicate: 'cmd: arch check; exit: 0' },
  ],
  '7-operations': [
    { desc: 'Operation completes without error', predicate: 'cmd: (command); exit: 0' },
    { desc: 'Output exists at expected path', predicate: 'file: (path)' },
    { desc: 'arch check passes', predicate: 'cmd: arch check; exit: 0' },
  ],
};

const DEFAULT_CLASS = '2-code-generation';
const DEFAULT_SIZE = 'M';

function ideaSlug(filename: string): string {
  return filename.replace(/^IDEA-/, '').replace(/\.md$/, '');
}

function extractTitle(content: string): string {
  const m = content.match(/^# IDEA:\s*(.+)/m);
  return m ? m[1].trim() : '(untitled)';
}

function extractMetaSize(content: string): string {
  const m = content.match(/\*\*Meta:\*\*.*?\|\s*(\S+)\s*\|/);
  return m ? m[1] : DEFAULT_SIZE;
}

function extractMetaClass(content: string): string {
  const m = content.match(/\*\*Meta:\*\*.*?\|\s*\S+\s*\|\s*\S+\s*\|\s*\S+\s*\|\s*(\S+)/);
  return m ? m[1] : DEFAULT_CLASS;
}

function extractEstimatedSize(content: string): string {
  const m = content.match(/## Estimated size\s*\n\s*(.+)/);
  return m ? m[1].trim() : DEFAULT_SIZE;
}

function extractRationale(content: string): string {
  const problem = content.match(/## Problem\s*\n([\s\S]*?)(?=\n##|\Z)/);
  const solution = content.match(/## Proposed solution\s*\n([\s\S]*?)(?=\n##|\Z)/i);
  const parts: string[] = [];
  if (problem) parts.push(`Problem: ${problem[1].trim().slice(0, 200)}`);
  if (solution) parts.push(`Solution: ${solution[1].trim().slice(0, 200)}`);
  return parts.join('\n') || 'No rationale extracted.';
}

function buildAcs(taskClass: string, ideaContent: string): ProposalAc[] {
  const templates = CLASS_TEMPLATES[taskClass] ?? CLASS_TEMPLATES[DEFAULT_CLASS];
  return templates.map(t => ({ description: t.desc, predicate: t.predicate }));
}

function computeNovelty(taskClass: string, taskSize: string): NoveltyInfo {
  try {
    const nodefs = new NodeFileSystem();
    const corpusService = new CorpusIndexService(nodefs);
    const corpus = corpusService.load();
    const entries = (corpus as any)?.entries ?? {};
    const descriptor: TaskDescriptor = {
      size: taskSize,
      class: taskClass,
      acMachineVerifiableRatio: 1.0,
      hanseiSeverity: 'H0',
    };
    const report = PrecedentNoveltyScorer.score(descriptor, entries);
    return {
      score: report.score,
      nearestPrecedents: report.nearestPrecedents,
      clusterSize: report.clusterSize,
      isHighNovelty: report.isHighNovelty,
    };
  } catch {
    return { score: 1.0, nearestPrecedents: [], clusterSize: 0, isHighNovelty: true };
  }
}

function surfaceUncertainties(content: string): UncertaintyEntry[] {
  const uncertainties: UncertaintyEntry[] = [];
  if (!content.match(/## Estimated size/)) {
    uncertainties.push({ field: 'size', note: 'No estimated size declared in IDEA — defaulted to M.' });
  }
  if (!content.match(/\*\*Meta:\*\*.*?class/i) && !content.match(/## Governance Class/i) && !content.match(/## Class/i)) {
    uncertainties.push({ field: 'class', note: 'No task class declared — defaulted to 2-code-generation.' });
  }
  if (!content.match(/## Dependencies/)) {
    uncertainties.push({ field: 'dependencies', note: 'No dependencies section found — assumed none.' });
  }
  if (!content.match(/## Proposed solution/i)) {
    uncertainties.push({ field: 'solution', note: 'No proposed solution section — recommendation is speculative.' });
  }
  return uncertainties;
}

export class PromotionProposalGenerator {
  constructor(private refinementDir: string = 'docs/refinement') {}

  generateAll(): PromotionProposal[] {
    const proposals: PromotionProposal[] = [];
    let files: string[] = [];
    try {
      files = fs.readdirSync(this.refinementDir).filter(
        f => f.startsWith('IDEA-') && f.endsWith('.md') && !f.includes('TEMPLATE')
      );
    } catch {
      return proposals;
    }

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.refinementDir, file), 'utf8');
        const slug = ideaSlug(file);
        const title = extractTitle(content);
        const taskClass = extractMetaClass(content);
        const estimatedSize = extractEstimatedSize(content);
        const size = extractMetaSize(content) !== DEFAULT_SIZE ? extractMetaSize(content) : estimatedSize;
        const rationale = extractRationale(content);
        const acs = buildAcs(taskClass, content);
        const novelty = computeNovelty(taskClass, size);
        const uncertainties = surfaceUncertainties(content);

        proposals.push({
          ideaSlug: slug,
          ideaPath: `${this.refinementDir}/${file}`,
          title,
          class: taskClass,
          size,
          rationale,
          acs,
          novelty,
          uncertainties,
          advisory: true,
        });
      } catch {
        // skip unreadable IDEA files
      }
    }

    return proposals;
  }

  formatProposal(p: PromotionProposal): string {
    const lines: string[] = [];
    lines.push(`  IDEA: ${p.ideaSlug}`);
    lines.push(`  Title: ${p.title}`);
    lines.push(`  Proposed: ${p.class} | ${p.size}`);
    lines.push(`  Advisory — preparation only. Human Decision field still required.`);
    lines.push(`  Novelty: ${p.novelty.isHighNovelty ? 'HIGH' : 'LOW'} (score: ${p.novelty.score.toFixed(2)}, cluster: ${p.novelty.clusterSize})`);
    if (p.novelty.nearestPrecedents.length > 0) {
      lines.push(`  Nearest precedents: ${p.novelty.nearestPrecedents.map(r => `${r.id}@${r.distance.toFixed(2)}`).join(', ')}`);
    }
    lines.push(`  ACs (${p.acs.length}):`);
    for (const ac of p.acs) {
      lines.push(`    - ${ac.description} → ${ac.predicate}`);
    }
    if (p.uncertainties.length > 0) {
      lines.push(`  Uncertainties:`);
      for (const u of p.uncertainties) {
        lines.push(`    - ${u.field}: ${u.note}`);
      }
    }
    lines.push('');
    return lines.join('\n');
  }
}
