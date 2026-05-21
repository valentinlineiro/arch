
import { UEGGraph, SubsystemView, Risk, InstrumentationSuggestion, Edge, Entity } from '../models/ueg-ir.js';

export class UEGAnalysisLayer {
  /**
   * Generates a non-binding structural lens over the graph.
   * Purely structural, NOT a module or architecture unit.
   */
  generateSubsystemViews(graph: UEGGraph): SubsystemView[] {
    const views: SubsystemView[] = [];
    
    // Group by directory as a structural lens
    const dirGroups = new Map<string, Entity[]>();
    for (const entity of graph.entities) {
      if (entity.location?.file) {
        const dir = entity.location.file.split('/').slice(0, -1).join('/') || 'root';
        if (!dirGroups.has(dir)) dirGroups.set(dir, []);
        dirGroups.get(dir)!.push(entity);
      }
    }

    for (const [dir, entities] of dirGroups.entries()) {
      const entityIds = entities.map(e => e.id);
      const relations = graph.edges.filter(e => entityIds.includes(e.from) || entityIds.includes(e.to));
      views.push({
        entities,
        relations,
        viewType: 'EMERGENT_VIEW',
      });
    }

    return views;
  }

  /**
   * Detects purely structural hazards.
   * Risk does NOT imply importance or priority.
   */
  detectRisks(graph: UEGGraph): Risk[] {
    const risks: Risk[] = [];

    // 1. HIGH_COUPLING (Structural descriptive only)
    const inbound = new Map<string, number>();
    const outbound = new Map<string, number>();
    for (const edge of graph.edges) {
      inbound.set(edge.to, (inbound.get(edge.to) || 0) + 1);
      outbound.set(edge.from, (outbound.get(edge.from) || 0) + 1);
    }

    for (const entity of graph.entities) {
      const inCount = inbound.get(entity.id) || 0;
      const outCount = outbound.get(entity.id) || 0;
      if (inCount > 20 && outCount > 20) {
        risks.push({
          type: 'HIGH_COUPLING',
          entities: [entity.id],
          observation: `Entity ${entity.id} has high connectivity in both directions.`,
          structuralCondition: `inbound: ${inCount}, outbound: ${outCount}`,
        });
      }
    }

    // 2. STRUCTURAL_AMBIGUITY (Low signal density)
    for (const entity of graph.entities) {
      const s = graph.signals[entity.id];
      if (s && s.ioIntensity.length === 0 && s.stateMutation.length === 0 && s.asyncDensity.length === 0) {
        risks.push({
          type: 'STRUCTURAL_AMBIGUITY',
          entities: [entity.id],
          observation: `Low behavioral signal density detected for ${entity.id}.`,
          structuralCondition: 'zero_signal_signature',
        });
      }
    }

    return risks;
  }

  /**
   * Suggests instrumentation points.
   * UNORDERED, NON-BINDING.
   */
  planInstrumentation(graph: UEGGraph, risks: Risk[]): InstrumentationSuggestion[] {
    const suggestions: InstrumentationSuggestion[] = [];

    // Map structural hazards to suggestions
    for (const risk of risks) {
      if (risk.type === 'HIGH_COUPLING' || risk.type === 'STRUCTURAL_AMBIGUITY') {
        for (const id of risk.entities) {
          suggestions.push({
            entityId: id,
            hookType: 'DEPENDENCY_TRACK',
            reason: `Structural state [${risk.type}] suggests explicit dependency tracking to resolve ambiguity.`,
          });
        }
      }
    }

    // Map High Mutation (if any signal exists)
    for (const entity of graph.entities) {
      const mutationSignals = graph.signals[entity.id]?.stateMutation || [];
      if (mutationSignals.some(s => s.value > 0.5)) {
        suggestions.push({
          entityId: entity.id,
          hookType: 'STATE_MUTATION_TRACK',
          reason: 'Structural observation of high state mutation density.',
        });
      }
    }

    return suggestions;
  }
}
