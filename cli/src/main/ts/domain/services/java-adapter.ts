
import { LanguageAdapter } from './ueg-interfaces.js';
import { UEGGraphFragment, Entity, Edge, BehavioralSignals } from '../models/ueg-ir.js';

export class JavaAdapter implements LanguageAdapter {
  readonly language = 'java';
  readonly supportedExtensions = ['.java'];

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
    const importRegex = /import\s+([a-zA-Z0-9_.]+);/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      edges.push({
        from: fileEntityId,
        to: `package:${match[1]}`,
        type: 'IMPORT',
        uncertainty: 'LOW',
        source: 'STATIC',
      });
    }

    // ── Structural Primitives (Classes) ──────────────────────────────────
    const classRegex = /public\s+class\s+([a-zA-Z0-9_]+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      const classId = `class:${file}:${className}`;
      entities.push({
        id: classId,
        kind: 'CLASS',
        name: className,
        location: { file },
      });
      edges.push({
        from: fileEntityId,
        to: classId,
        type: 'INSTANTIATE', // File defines the class
        uncertainty: 'LOW',
        source: 'STATIC',
      });
    }

    // ── Structural Primitives (Reflection - EXPLICIT UNCERTAINTY) ─────────
    if (content.includes('Class.forName') || content.includes('.getDeclaredMethod')) {
      edges.push({
        from: fileEntityId,
        to: 'unknown:reflective-boundary',
        type: 'UNKNOWN_DEPENDENCY',
        uncertainty: 'HIGH',
        source: 'HEURISTIC',
      });
    }

    // ── Behavioral Signals ───────────────────────────────────────────────
    const lines = content.split('\n');
    const totalLines = lines.length;

    const ioCount = (content.match(/java\.io|java\.net|java\.sql|URLConnection|Socket/g) || []).length;
    const asyncCount = (content.match(/CompletableFuture|Thread|Executor|synchronized/g) || []).length;
    const mutationCount = (content.match(/this\.[a-zA-Z0-9_]+\s*=|set[A-Z][a-zA-Z0-9_]*\(/g) || []).length;

    signals[fileEntityId] = {
      ioIntensity: [{ source: 'regex', value: this.normalize(ioCount, totalLines, 0.05) }],
      asyncDensity: [{ source: 'regex', value: this.normalize(asyncCount, totalLines, 0.1) }],
      stateMutation: [{ source: 'regex', value: this.normalize(mutationCount, totalLines, 0.15) }],
      configDependency: [],
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
