import type { Phase1Event } from '../models/ontology.js';

export interface PartitioningConfig {
  readonly seed: string; // Generated per-run (e.g. CLI run timestamp), never persisted
  readonly baseWindowSize: number; // e.g. 10 events
  readonly variationDelta: number; // Bounded stochastic deviation (e.g. ±3 events)
}

export class TransientWindowCompiler {
  /**
   * Partitions flat events using a bounded stochastic offset seeded strictly 
   * for the duration of the current run, breaking cross-run fingerprint correlation.
   * Windows are strictly ephemeral, non-referential, and isolated.
   */
  public static partition(
    events: Phase1Event[], 
    config: PartitioningConfig
  ): Phase1Event[][] {
    const windows: Phase1Event[][] = [];
    let currentIndex = 0;
    
    // Seeded pseudo-random number generator strictly scoped to execution
    const prng = this.createPrng(config.seed);

    while (currentIndex < events.length) {
      const offset = Math.floor(prng() * (config.variationDelta * 2 + 1)) - config.variationDelta;
      const currentWindowSize = Math.max(1, config.baseWindowSize + offset);
      
      windows.push(events.slice(currentIndex, currentIndex + currentWindowSize));
      currentIndex += currentWindowSize;
    }

    return windows;
  }

  /**
   * Simple seeded PRNG (Mulberry32 or similar) to ensure deterministic playback
   * within a single run, but non-reproducibility across runs due to shifting seeds.
   */
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
