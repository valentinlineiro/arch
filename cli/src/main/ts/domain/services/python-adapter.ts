
import { LanguageAdapter } from './ueg-interfaces.js';
import { UEGGraphFragment, Entity, Edge, BehavioralSignals } from '../models/ueg-ir.js';

export class PythonAdapter implements LanguageAdapter {
  readonly language = 'python';
  readonly supportedExtensions = ['.py'];

  async parse(file: string, content: string): Promise<UEGGraphFragment> {
    const entities: Entity[] = [];
    const edges: Edge[] = [];
    const signals: Record<string, BehavioralSignals> = {};

    const fileEntityId = `file:${file}`;
    entities.push({
      id: fileEntityId,
      kind: 'FILE',
      name: file,
      location: { file },
    });

    // ── Structural Primitives (Imports) ──────────────────────────────────
    // Standard: import x, from x import y
    const importRegex = /(?:^|\n)(?:import\s+([a-zA-Z0-9_.,\s]+)|from\s+([a-zA-Z0-9_.]+)\s+import\s+([a-zA-Z0-9_*,\s]+))/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const directImport = match[1];
      const fromModule = match[2];
      
      if (directImport) {
        for (const imp of directImport.split(',')) {
          edges.push({
            from: fileEntityId,
            to: `module:${imp.trim()}`,
            type: 'IMPORT',
            uncertainty: 'LOW',
            source: 'STATIC',
          });
        }
      } else if (fromModule) {
        edges.push({
          from: fileEntityId,
          to: `module:${fromModule.trim()}`,
          type: 'IMPORT',
          uncertainty: 'LOW',
          source: 'STATIC',
        });
      }
    }

    // ── Structural Primitives (Classes/Functions) ────────────────────────
    const classRegex = /(?:^|\n)class\s+([a-zA-Z0-9_]+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classId = `class:${file}:${className}`;
      entities.push({ id: classId, kind: 'CLASS', name: className, location: { file } });
      edges.push({ from: fileEntityId, to: classId, type: 'INSTANTIATE', uncertainty: 'LOW', source: 'STATIC' });
    }

    const funcRegex = /(?:^|\n)def\s+([a-zA-Z0-9_]+)/g;
    while ((match = funcRegex.exec(content)) !== null) {
      const funcName = match[1];
      const funcId = `func:${file}:${funcName}`;
      entities.push({ id: funcId, kind: 'FUNCTION', name: funcName, location: { file } });
      edges.push({ from: fileEntityId, to: funcId, type: 'CALL', uncertainty: 'LOW', source: 'STATIC' });
    }

    // ── Behavioral Signals ───────────────────────────────────────────────
    const lines = content.split('\n');
    const totalLines = lines.length;

    const ioCount = (content.match(/os\.|pathlib|requests\.|urllib|flask|fastapi|django|sqlalchemy|psycopg2|open\(|write\(|read\(/g) || []).length;
    const asyncCount = (content.match(/\b(async|await|asyncio|aiohttp|threading|multiprocessing)\b/g) || []).length;
    const mutationCount = (content.match(/self\.[a-zA-Z0-9_]+\s*=|global\s+|[a-zA-Z0-9_]+\s*=\s*/g) || []).length;

    signals[fileEntityId] = {
      ioIntensity: [{ source: 'regex', value: this.normalize(ioCount, totalLines, 0.05) }],
      asyncDensity: [{ source: 'regex', value: this.normalize(asyncCount, totalLines, 0.1) }],
      stateMutation: [{ source: 'regex', value: this.normalize(mutationCount, totalLines, 0.15) }],
      configDependency: [{ source: 'regex', value: (content.match(/os\.environ|dotenv|config\./g) || []).length > 0 ? 1 : 0 }],
      externalDependencyRatio: [],
    };

    return {
      entities,
      edges,
      signals,
      completeness: 'PARTIAL',
    };
  }

  private normalize(count: number, total: number, highThreshold: number): number {
    if (total === 0) return 0;
    return Math.min(1, (count / total) / highThreshold);
  }
}
