
import { LanguageAdapter } from './ueg-interfaces.js';
import { UEGGraphFragment, Entity, Edge, BehavioralSignals, SignalValue } from '../models/ueg-ir.js';
import { dirname, join } from 'node:path';

export class TypeScriptAdapter implements LanguageAdapter {
  readonly language = 'typescript';
  readonly supportedExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

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
    const importRegex = /(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const target = match[1];
      if (target.startsWith('.')) {
        const resolved = this.resolveInternalPath(file, target);
        edges.push({
          from: fileEntityId,
          to: `file:${resolved}`,
          type: 'IMPORT',
          uncertainty: 'LOW',
          source: 'STATIC',
        });
      } else {
        // External dependency
        edges.push({
          from: fileEntityId,
          to: `module:${target}`,
          type: 'IMPORT',
          uncertainty: 'LOW',
          source: 'STATIC',
        });
      }
    }

    // ── Structural Primitives (Calls - Heuristic) ────────────────────────
    const callRegex = /([a-zA-Z0-9_]+)\(/g;
    while ((match = callRegex.exec(content)) !== null) {
      // Very crude heuristic for MVP
      if (!['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
        // Note: we don't know the target entity ID without full AST resolution
        // so we omit edges or use UNKNOWN_DEPENDENCY if we wanted to be noisy.
      }
    }

    // ── Behavioral Signals ───────────────────────────────────────────────
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    const ioCount = (content.match(/fetch\(|axios\.|fs\.|pg\.|prisma\.|aws-sdk|db\.|socket\.|http\./gi) || []).length;
    const asyncCount = (content.match(/\b(async|await|Promise)\b/g) || []).length;
    const mutationCount = (content.match(/\b(let|var)\s+|this\.[a-zA-Z0-9_]+\s*=/g) || []).length;
    const configCount = (content.match(/process\.env|dotenv/g) || []).length;

    signals[fileEntityId] = {
      ioIntensity: [{ source: 'regex', value: this.normalize(ioCount, totalLines, 0.05) }],
      asyncDensity: [{ source: 'regex', value: this.normalize(asyncCount, totalLines, 0.1) }],
      stateMutation: [{ source: 'regex', value: this.normalize(mutationCount, totalLines, 0.15) }],
      configDependency: [{ source: 'regex', value: this.normalize(configCount, totalLines, 0.01) }],
      externalDependencyRatio: [], // To be calculated by IR merger or graph layer
    };

    return {
      entities,
      edges,
      signals,
      completeness: 'PARTIAL',
    };
  }

  private resolveInternalPath(sourceFile: string, importPath: string): string {
    const dir = dirname(sourceFile);
    let resolved = join(dir, importPath).replace(/\\/g, '/');
    if (resolved.startsWith('./')) resolved = resolved.slice(2);
    // Remove .js extension if present in ESM style imports
    if (resolved.endsWith('.js')) resolved = resolved.slice(0, -3);
    return resolved;
  }

  private normalize(count: number, total: number, highThreshold: number): number {
    if (total === 0) return 0;
    return Math.min(1, (count / total) / highThreshold);
  }
}
