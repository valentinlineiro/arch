import type { CorpusEntry } from '../../application/use-cases/corpus-index.js';

export interface TaskDescriptor {
  size: string;
  class: string;
  acMachineVerifiableRatio: number;
  hanseiSeverity: string;
}

export interface PrecedentRef {
  id: string;
  distance: number;
}

export interface NoveltyReport {
  score: number;
  nearestPrecedents: PrecedentRef[];
  clusterSize: number;
  isHighNovelty: boolean;
}

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL'];
const SEVERITY_ORDER = ['H0', 'H1', 'H2', 'H3a', 'H3b'];
const MAX_NEAREST = 5;

export class PrecedentNoveltyScorer {
  static readonly HIGH_NOVELTY_THRESHOLD = 0.6;

  static score(descriptor: TaskDescriptor, corpus: Record<string, CorpusEntry>): NoveltyReport {
    const entries = Object.values(corpus);
    if (entries.length === 0) {
      return { score: 1.0, nearestPrecedents: [], clusterSize: 0, isHighNovelty: true };
    }

    const clusterSize = entries.filter(
      e => e.class === descriptor.class && e.size === descriptor.size
    ).length;

    const distances = entries.map(e => ({
      id: e.id,
      distance: PrecedentNoveltyScorer.distance(descriptor, e),
    }));

    distances.sort((a, b) => a.distance - b.distance);

    const nearestPrecedents = distances.slice(0, MAX_NEAREST);
    const score = distances.length > 0 ? distances[0].distance : 1.0;

    return {
      score,
      nearestPrecedents,
      clusterSize,
      isHighNovelty: score >= PrecedentNoveltyScorer.HIGH_NOVELTY_THRESHOLD,
    };
  }

  private static distance(d: TaskDescriptor, e: CorpusEntry): number {
    const classMatch = d.class === e.class ? 0 : 1;
    const sizeIdx = SIZE_ORDER.indexOf(d.size);
    const eSizeIdx = SIZE_ORDER.indexOf(e.size);
    const sizeDist = sizeIdx >= 0 && eSizeIdx >= 0
      ? Math.abs(sizeIdx - eSizeIdx) / (SIZE_ORDER.length - 1)
      : 0.5;
    const acRatio = e.acCount > 0 ? e.acMachineVerifiable / e.acCount : 0;
    const acDist = Math.abs(d.acMachineVerifiableRatio - acRatio);
    const sevIdx = SEVERITY_ORDER.indexOf(d.hanseiSeverity);
    const eSevIdx = SEVERITY_ORDER.indexOf(e.severity);
    const sevDist = sevIdx >= 0 && eSevIdx >= 0
      ? Math.abs(sevIdx - eSevIdx) / (SEVERITY_ORDER.length - 1)
      : 0.5;

    // Weights: class (40%), size (25%), AC ratio (20%), severity (15%)
    return classMatch * 0.40 + sizeDist * 0.25 + acDist * 0.20 + sevDist * 0.15;
  }
}
