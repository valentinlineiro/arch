
import { IRBuilder } from './ueg-interfaces.js';
import { UEGGraph, UEGGraphFragment, Entity, Edge, BehavioralSignals } from '../models/ueg-ir.js';

export class UEGIRBuilder implements IRBuilder {
  merge(fragments: UEGGraphFragment[], languageCoverage: string[]): UEGGraph {
    const entities = new Map<string, Entity>();
    const edges: Edge[] = [];
    const signals: Record<string, BehavioralSignals> = {};

    for (const frag of fragments) {
      // 1. Entity Deduplication (Deduplicate by ID - which contains file + symbol)
      for (const entity of frag.entities) {
        if (!entities.has(entity.id)) {
          entities.set(entity.id, entity);
        }
      }

      // 2. Edge Union
      for (const edge of frag.edges) {
        // Union only - no aggregation
        edges.push(edge);
      }

      // 3. Signal Merge (Preserve all sources, NO averaging)
      for (const [id, fragSignals] of Object.entries(frag.signals)) {
        if (!signals[id]) {
          signals[id] = {
            ioIntensity: [],
            stateMutation: [],
            asyncDensity: [],
            configDependency: [],
            externalDependencyRatio: [],
          };
        }

        signals[id].ioIntensity.push(...fragSignals.ioIntensity);
        signals[id].stateMutation.push(...fragSignals.stateMutation);
        signals[id].asyncDensity.push(...fragSignals.asyncDensity);
        signals[id].configDependency.push(...fragSignals.configDependency);
        signals[id].externalDependencyRatio.push(...fragSignals.externalDependencyRatio);
      }
    }

    return {
      entities: Array.from(entities.values()),
      edges,
      signals,
      metadata: {
        languageCoverage,
        completeness: fragments.some(f => f.completeness === 'PARTIAL') ? 'PARTIAL' : 'FULL',
      },
    };
  }
}
