import type { Phase1Event, Phase2WindowOutput, BoundedHypothesis } from '../models/ontology.js';

export class StatelessHypothesisGenerator {
  /**
   * Compresses window-bound ambiguity into local, competing explanations.
   * Maps a single, isolated window's event distribution to competing operational typologies.
   * Applies bounded stochastic weight perturbations scoped to the current run's seed
   * to prevent cross-run structural fingerprinting.
   */
  public static generate(
    windowEvents: Phase1Event[],
    windowIndex: number,
    executionSeed: string
  ): Phase2WindowOutput {
    const windowId = `win-${windowIndex}-${this.simpleHash(executionSeed + '-' + windowIndex)}`;
    const eventIds = windowEvents.map(e => e.event_id);

    if (windowEvents.length === 0) {
      return {
        window_id: windowId,
        hypotheses: [
          {
            interpretation_type: 'empty_observational_span',
            supporting_events: [],
            confidence: 1.0,
          },
        ],
      };
    }

    // 1. Gather raw counts within the window
    let codeWrites = 0;
    let configWrites = 0;
    let processEvents = 0;
    let otherEvents = 0;

    for (const event of windowEvents) {
      const cat = event.attributes.raw_category;
      const fClass = event.attributes.file_class;

      if (cat === 'file_write') {
        if (fClass === 'code_like') {
          codeWrites++;
        } else if (fClass === 'config_like') {
          configWrites++;
        } else {
          otherEvents++;
        }
      } else if (cat === 'process_event' || cat === 'ci_event') {
        processEvents++;
      } else {
        otherEvents++;
      }
    }

    const total = windowEvents.length;

    // 2. Define base typologies and their heuristic support
    const typologies = [
      {
        type: 'syntactic_refinement', // Pure code writing churn
        baseWeight: codeWrites / total,
      },
      {
        type: 'environmental_alignment', // CI/process fluctuations
        baseWeight: processEvents / total,
      },
      {
        type: 'structural_configuration', // Config changes
        baseWeight: configWrites / total,
      },
      {
        type: 'unclassified_drift', // Default noise
        baseWeight: otherEvents / total || 0.1,
      },
    ];

    // 3. Inject bounded stochastic perturbation scoped strictly to execution seed
    // This breaks cross-run structural fingerprint correlation.
    const prng = this.createPrng(executionSeed + '-' + windowId);
    let perturbedSum = 0;
    
    const rawHypotheses = typologies.map(t => {
      // Perturb base weight by up to ±0.15
      const perturbation = (prng() * 0.3) - 0.15;
      const perturbedWeight = Math.max(0.01, t.baseWeight + perturbation);
      perturbedSum += perturbedWeight;
      return {
        type: t.type,
        weight: perturbedWeight,
      };
    });

    // 4. Normalize weights to ensure confidence sums to exactly 1.0
    const hypotheses: BoundedHypothesis[] = rawHypotheses
      .map(h => ({
        interpretation_type: h.type,
        supporting_events: eventIds,
        confidence: Math.round((h.weight / perturbedSum) * 100) / 100,
      }))
      // Sort descending by confidence to keep output structured
      .sort((a, b) => b.confidence - a.confidence);

    return {
      window_id: windowId,
      hypotheses,
    };
  }

  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
    }
    return Math.abs(hash).toString(16);
  }

  private static createPrng(seed: string): () => number {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
    return () => {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
}
