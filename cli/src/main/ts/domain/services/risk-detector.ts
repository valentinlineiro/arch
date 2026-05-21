
import { Subsystem, Risk, DependencyGraph } from '../models/deployment-map.js';

export class RiskDetector {
  detect(subsystems: Subsystem[], graph: DependencyGraph): Risk[] {
    const risks: Risk[] = [];

    // 1. COUPLING Risk
    for (const s of subsystems) {
      if (s.dependencyProfile.inbound > 10 && s.dependencyProfile.outbound > 10) {
        risks.push({
          type: 'COUPLING',
          severity: 'HIGH',
          locations: [s.id],
          description: `High bi-directional coupling detected in ${s.id}. Subsystem acts as both a central utility and a high-level orchestrator.`,
        });
      }
    }

    // 2. UNCONTROLLED_IO Risk
    for (const s of subsystems) {
      if (s.inferredRole.label.includes('Domain Core') && s.behavioralProfile.ioIntensity === 'HIGH') {
        risks.push({
          type: 'UNCONTROLLED_IO',
          severity: 'HIGH',
          locations: [s.id],
          description: `Uncontrolled IO spread: ${s.id} is inferred as Domain Core but exhibits High IO intensity. Possible leak of infrastructure concerns into core logic.`,
        });
      }
    }

    // 3. STRUCTURAL_AMBIGUITY Risk
    for (const s of subsystems) {
      const p = s.behavioralProfile;
      if (p.ioIntensity === 'LOW' && p.asyncDensity === 'LOW' && p.stateMutationDensity === 'LOW' && p.configDependency === 'LOW') {
        risks.push({
          type: 'STRUCTURAL_AMBIGUITY',
          severity: 'MEDIUM',
          locations: [s.id],
          description: `Low signal density in ${s.id}. No clear behavioral signature detected, making this subsystem an 'uncertainty cluster' that may hide complex interactions.`,
        });
      }
    }

    // 4. HIDDEN_BOUNDARY Risk (Subsystems with very high file count but low internal deps?)
    // Or high internal deps but split across multiple directories.
    // For MVP, let's look for large subsystems (>30 files) with generic roles.
    for (const s of subsystems) {
      if (s.files.length > 30 && s.inferredRole.label === 'General-purpose module') {
        risks.push({
          type: 'HIDDEN_BOUNDARY',
          severity: 'MEDIUM',
          locations: [s.id],
          description: `Potential hidden boundary in large subsystem ${s.id} (${s.files.length} files). High probability of missing internal modularity.`,
        });
      }
    }

    return risks;
  }
}
