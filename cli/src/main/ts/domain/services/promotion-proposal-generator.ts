import fs from 'node:fs';
import path from 'node:path';
import type { PromotionProposal, ProposalAc, NoveltyInfo, UncertaintyEntry } from '../models/promotion-proposal.js';
import { CorpusIndexService } from '../../application/use-cases/corpus-index.js';
import { PathResolver } from './path-resolver.js';
import { NodeFileSystem } from '../../infrastructure/filesystem/node-file-system.js';

const CLASS_TEMPLATES: Record<string, Array<{ desc: string; predicate: string }>> = {
  '2-code-generation': [
    { desc: 'Implementation file exists at declared context path', predicate: 'file: (path)' },
    { desc: 'Tests pass', predicate: 'cmd: npm test; exit: 0' },
    { desc: 'arch review passes', predicate: 'cmd: arch review; exit: 0' },
  ],
  '6-writing': [
    { desc: 'Document created at declared path', predicate: 'file: (path)' },
    { desc: 'Content is accurate and complete', predicate: 'prose: reviewed and verified' },
    { desc: 'arch review passes', predicate: 'cmd: arch review; exit: 0' },
  ],
  '7-operations': [
    { desc: 'Operation completes without error', predicate: 'cmd: (command); exit: 0' },
    { desc: 'Output exists at expected path', predicate: 'file: (path)' },
    { desc: 'arch review passes', predicate: 'cmd: arch review; exit: 0' },
  ],
};

const VALID_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL']);
const VALID_CLASSES = new Set([
  '1-code-reasoning', '2-code-generation', '3-chore',
  '4-test-generation', '5-data', '6-writing', '7-operations',
]);

export interface IdeaMetadata {
  title: string | null;
  candidateClass: string | null;
  candidateSize: string | null;
  hasDecision: boolean;
  missingFields: string[];
}

function ideaSlug(filename: string): string {
  return filename.replace(/^IDEA-/, '').replace(/\.md$/, '');
}

function extractTitle(content: string): string {
  const m = content.match(/^# IDEA:\s*(.+)/m);
  return m ? m[1].trim() : '(untitled)';
}

/** Parse explicit Candidate-class field (new template format) */
function extractCandidateClass(content: string): string | null {
  const explicit = content.match(/\*\*Candidate-class:\*\*\s*([^\s\n|]+)/i);
  if (explicit) {
    const val = explicit[1].trim().replace(/[[\]]/g, '');
    return VALID_CLASSES.has(val) ? val : null;
  }
  return null;
}

/** Parse explicit Candidate-size field (new template format) */
function extractCandidateSize(content: string): string | null {
  const explicit = content.match(/\*\*Candidate-size:\*\*\s*([^\s\n|]+)/i);
  if (explicit) {
    const val = explicit[1].trim().replace(/[[\]]/g, '');
    return VALID_SIZES.has(val) ? val : null;
  }
  // Fallback: legacy ## Estimated size section
  const legacy = content.match(/## Estimated size\s*\n\s*([^\n]+)/);
  if (legacy) {
    const val = legacy[1].trim().split(/\s+/)[0];
    return VALID_SIZES.has(val) ? val : null;
  }
  return null;
}

function hasDecisionSet(content: string): boolean {
  const decisionMatch = content.match(/## Decision\s*\n([\s\S]*?)(?=\n##|$)/m);
  if (!decisionMatch) return false;
  const body = decisionMatch[1];
  // Strip comment lines — only real content counts
  const uncommented = body.split('\n')
    .filter(l => !l.trim().startsWith('<!--') && !l.trim().startsWith('-->') && l.trim() !== '')
    .join('\n').trim();
  return uncommented.length > 0;
}

export function extractIdeaMetadata(content: string): IdeaMetadata {
  const title = extractTitle(content);
  const candidateClass = extractCandidateClass(content);
  const candidateSize = extractCandidateSize(content);
  const missingFields: string[] = [];
  if (!candidateClass) missingFields.push('candidate-class');
  if (!candidateSize) missingFields.push('candidate-size');
  return {
    title,
    candidateClass,
    candidateSize,
    hasDecision: hasDecisionSet(content),
    missingFields,
  };
}

function extractRationale(content: string): string {
  const problem = content.match(/## Problem\s*\n([\s\S]*?)(?=\n##|\Z)/);
  const outcome = content.match(/## Proposed outcome\s*\n([\s\S]*?)(?=\n##|\Z)/i);
  const solution = content.match(/## Proposed solution\s*\n([\s\S]*?)(?=\n##|\Z)/i);
  const parts: string[] = [];
  if (problem) parts.push(`Problem: ${problem[1].trim().slice(0, 200)}`);
  if (outcome) parts.push(`Outcome: ${outcome[1].trim().slice(0, 200)}`);
  else if (solution) parts.push(`Solution: ${solution[1].trim().slice(0, 200)}`);
  return parts.join('\n') || 'No rationale extracted.';
}

function buildAcs(taskClass: string): ProposalAc[] {
  const templates = CLASS_TEMPLATES[taskClass] ?? CLASS_TEMPLATES['2-code-generation'];
  return templates.map(t => ({ description: t.desc, predicate: t.predicate }));
}

function computeNovelty(taskClass: string, taskSize: string): NoveltyInfo {
  try {
    const nodefs = new NodeFileSystem();
    const corpusService = new CorpusIndexService(nodefs);
    const corpus = corpusService.load();
    const entries = (corpus as any)?.entries ?? {};
    const descriptor = {
      size: taskSize,
      class: taskClass,
      acMachineVerifiableRatio: 1.0,
      hanseiSeverity: 'H0',
    };
    const report = { noveltyScore: 0.5, reasoning: "PrecedentNoveltyScorer removed (TASK-1116)" };
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

export interface IdeaFileEntry {
  slug: string;
  filePath: string;
  content: string;
  metadata: IdeaMetadata;
}

export class PromotionProposalGenerator {
  constructor(private refinementDir: string = PathResolver.from({}).refinement) {}

  /** Returns all IDEA files parsed with metadata — used for both proposals and AWAITING_PROMOTION scan. */
  scanIdeas(): IdeaFileEntry[] {
    const entries: IdeaFileEntry[] = [];
    let files: string[] = [];
    try {
      files = fs.readdirSync(this.refinementDir).filter(
        f => f.startsWith('IDEA-') && f.endsWith('.md') && !f.includes('TEMPLATE')
      );
    } catch {
      return entries;
    }

    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.refinementDir, file), 'utf8');
        entries.push({
          slug: ideaSlug(file),
          filePath: path.join(this.refinementDir, file),
          content,
          metadata: extractIdeaMetadata(content),
        });
      } catch {
        // skip unreadable files
      }
    }
    return entries;
  }

  generateAll(): PromotionProposal[] {
    const proposals: PromotionProposal[] = [];
    for (const entry of this.scanIdeas()) {
      const { slug, content, metadata } = entry;
      // Skip IDEA files that already have a Decision — they don't need a proposal
      if (metadata.hasDecision) continue;

      const rationale = extractRationale(content);

      if (metadata.missingFields.length > 0) {
        // Surface missing fields — include in proposal with empty ACs
        proposals.push({
          ideaSlug: slug,
          ideaPath: entry.filePath,
          title: metadata.title ?? '(untitled)',
          class: null as any,
          size: null as any,
          rationale,
          acs: [],
          novelty: { score: 1.0, nearestPrecedents: [], clusterSize: 0, isHighNovelty: true },
          uncertainties: metadata.missingFields.map(f => ({
            field: f,
            note: `Required field '${f}' is missing — cannot generate ACs without it.`,
          })),
          advisory: true,
          missingFields: metadata.missingFields,
        });
        continue;
      }

      const taskClass = metadata.candidateClass!;
      const size = metadata.candidateSize!;
      const acs = buildAcs(taskClass);
      const novelty = computeNovelty(taskClass, size);

      proposals.push({
        ideaSlug: slug,
        ideaPath: entry.filePath,
        title: metadata.title ?? '(untitled)',
        class: taskClass,
        size,
        rationale,
        acs,
        novelty,
        uncertainties: [],
        advisory: true,
        missingFields: [],
      });
    }

    return proposals;
  }

  formatProposal(p: PromotionProposal): string {
    const lines: string[] = [];
    lines.push(`  IDEA: ${p.ideaSlug}`);
    lines.push(`  Title: ${p.title}`);

    if (p.missingFields && p.missingFields.length > 0) {
      lines.push(`  ⚠ Missing required fields: ${p.missingFields.join(', ')}`);
      lines.push(`  Cannot generate ACs — add fields to IDEA file and re-run.`);
    } else {
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
    }
    lines.push('');
    return lines.join('\n');
  }
}
