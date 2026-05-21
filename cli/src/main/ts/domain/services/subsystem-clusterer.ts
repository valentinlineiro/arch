
import { Subsystem, DependencyGraph } from '../models/deployment-map.js';
import { dirname } from 'node:path';

export class SubsystemClusterer {
  cluster(files: string[], graph: DependencyGraph): Subsystem[] {
    const clusters = new Map<string, string[]>();

    // Step 1: Directory-based seeding
    for (const file of files) {
      const dir = this.getSeedDirectory(file);
      if (!clusters.has(dir)) clusters.set(dir, []);
      clusters.get(dir)!.push(file);
    }

    // Step 2: Refinement via import cohesion (MVP: simple move if isolated)
    // For now, we'll stick to the seed but identify "outsiders" in the next phase.
    
    return Array.from(clusters.entries()).map(([id, clusterFiles]) => {
      const inbound = graph.edges.filter(e => clusterFiles.includes(e.to) && !clusterFiles.includes(e.from)).length;
      const outbound = graph.edges.filter(e => clusterFiles.includes(e.from) && !clusterFiles.includes(e.to)).length;
      
      return {
        id,
        files: clusterFiles,
        dependencyProfile: {
          inbound,
          outbound,
          externalDependencies: [], // Filled in during profiling/refinement
        },
        behavioralProfile: {
          ioIntensity: 'LOW',
          asyncDensity: 'LOW',
          stateMutationDensity: 'LOW',
          configDependency: 'LOW',
        },
        inferredRole: {
          label: 'unknown',
          basis: [],
        },
      };
    });
  }

  private getSeedDirectory(file: string): string {
    const parts = file.split('/');
    if (parts.length <= 1) return 'root';
    
    // Deeper seeding for src folders
    if (parts[0] === 'src' && parts.length > 3) {
      if (parts[1] === 'main' || parts[1] === 'test') {
        return `src/${parts[1]}/${parts[2]}`;
      }
      return `src/${parts[1]}`;
    }
    return parts[0];
  }
}
