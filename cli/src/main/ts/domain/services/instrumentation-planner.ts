
import { Subsystem, Risk, InstrumentationPlan, InstrumentationHook, ExtractionResult } from '../models/deployment-map.js';

// Add ExtractionResult to models for clean passing
// I already used it in structural-extractor but didn't put it in models.

export class InstrumentationPlanner {
  plan(subsystems: Subsystem[], risks: Risk[], structural: any): InstrumentationPlan {
    const hooks: InstrumentationHook[] = [];
    const high: string[] = [];
    const medium: string[] = [];
    const low: string[] = [];

    // 1. Map Entrypoints to REQUEST_BOUNDARY
    for (const ep of structural.entrypoints) {
      hooks.push({
        location: ep,
        type: 'REQUEST_BOUNDARY',
        reason: 'Primary repository entrypoint detected during structural extraction.',
      });
      high.push(ep);
    }

    // 2. Map Risks to DEPENDENCY_TRACKING
    for (const risk of risks) {
      if (risk.type === 'COUPLING' || risk.type === 'STRUCTURAL_AMBIGUITY') {
        for (const loc of risk.locations) {
          hooks.push({
            location: loc,
            type: 'DEPENDENCY_TRACKING',
            reason: `Mitigating ${risk.type} risk: explicit dependency tracking required to resolve architectural noise.`,
          });
          if (risk.severity === 'HIGH') high.push(loc);
          else medium.push(loc);
        }
      }
    }

    // 3. Map High Mutation subsystems to STATE_MUTATION_TRACKING
    for (const s of subsystems) {
      if (s.behavioralProfile.stateMutationDensity === 'HIGH') {
        hooks.push({
          location: s.id,
          type: 'STATE_MUTATION_TRACKING',
          reason: 'High state mutation density detected. Monitoring state transitions is critical for this subsystem.',
        });
        if (!high.includes(s.id)) medium.push(s.id);
      } else if (s.behavioralProfile.ioIntensity === 'LOW') {
        low.push(s.id);
      }
    }

    return {
      highPriority: [...new Set(high)],
      mediumPriority: [...new Set(medium.filter(m => !high.includes(m)))],
      lowPriority: [...new Set(low.filter(l => !high.includes(l) && !medium.includes(l)))],
      recommendedHooks: hooks,
    };
  }
}
