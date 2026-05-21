
import { Subsystem } from '../models/deployment-map.js';

export class RoleInferenceEngine {
  infer(subsystems: Subsystem[]): Subsystem[] {
    for (const subsystem of subsystems) {
      const profile = subsystem.behavioralProfile;
      const basis: string[] = [];
      let hypothesis = 'General-purpose module';

      if (profile.ioIntensity === 'HIGH' || profile.ioIntensity === 'MEDIUM') {
        basis.push(`Elevated IO Intensity (${profile.ioIntensity})`);
        if (profile.asyncDensity === 'HIGH') {
          hypothesis = 'External Integration / Network Layer';
          basis.push('High Async density');
        } else {
          hypothesis = 'Data-access or Persistence Layer';
        }
      }

      if (profile.stateMutationDensity === 'HIGH' && profile.ioIntensity === 'LOW') {
        hypothesis = 'Probable Domain Core / State Management';
        basis.push('High State Mutation density with low IO');
      }

      if (profile.configDependency === 'HIGH') {
        hypothesis = 'Infrastructure / Orchestration';
        basis.push('High Config Dependency');
      }

      if (subsystem.id.includes('test') || subsystem.id.includes('mock')) {
        hypothesis = 'Test / Mock Infrastructure';
        basis.push(`ID contains "${subsystem.id}"`);
      }

      subsystem.inferredRole = {
        label: hypothesis,
        basis,
      };
    }
    return subsystems;
  }
}
