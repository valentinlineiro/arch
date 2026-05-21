
import { Subsystem, Intensity } from '../models/deployment-map.js';
import { FileSystem } from '../repositories/file-system.js';
import { join } from 'node:path';

export class BehavioralProfiler {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async profile(subsystems: Subsystem[]): Promise<Subsystem[]> {
    for (const subsystem of subsystems) {
      const stats = {
        io: 0,
        async: 0,
        mutation: 0,
        config: 0,
        totalLines: 0,
      };

      for (const file of subsystem.files) {
        try {
          const content = await this.fileSystem.readFile(join(this.rootPath, file));
          const lines = content.split('\n');
          stats.totalLines += lines.length;
          
          stats.io += (content.match(/fetch\(|axios\.|fs\.|pg\.|prisma\.|aws-sdk|db\.|socket\.|http\./gi) || []).length;
          stats.async += (content.match(/\b(async|await|Promise)\b/g) || []).length;
          stats.mutation += (content.match(/\b(let|var)\s+|this\.[a-zA-Z0-9_]+\s*=/g) || []).length;
          stats.config += (content.match(/process\.env|dotenv/g) || []).length;
        } catch { /* skip */ }
      }

      subsystem.behavioralProfile = {
        ioIntensity: this.calculateIntensity(stats.io, stats.totalLines, 0.05),
        asyncDensity: this.calculateIntensity(stats.async, stats.totalLines, 0.1),
        stateMutationDensity: this.calculateIntensity(stats.mutation, stats.totalLines, 0.15),
        configDependency: this.calculateIntensity(stats.config, stats.totalLines, 0.01),
      };
    }

    return subsystems;
  }

  private calculateIntensity(count: number, totalLines: number, highThreshold: number): Intensity {
    if (totalLines === 0) return 'LOW';
    const density = count / totalLines;
    if (density >= highThreshold) return 'HIGH';
    if (density >= highThreshold / 3) return 'MEDIUM';
    return 'LOW';
  }
}
