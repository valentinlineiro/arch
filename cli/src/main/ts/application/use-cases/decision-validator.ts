import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export interface CausalTrace {
  readonly traceId: string;
  readonly taskId: string;
  readonly activeCausalNeighborhood: {
    readonly hotSeeds: string[];
    readonly expansionPath: string[];
  };
  readonly heuristicInputs: Array<{
    readonly inferenceId: string;
    readonly model: string;
    readonly confidence: number;
    readonly weight: number;
    readonly signals: string[];
  }>;
  readonly humanDecisionOverride: boolean;
  readonly timestamp: string;
}

export class DecisionValidator {
  constructor(private fileSystem: FileSystem) {}

  calculateEntropy(heuristics: Array<{ confidence: number }>, override: boolean): number {
    if (heuristics.length === 0) return 0.0;
    const avgConfidence = heuristics.reduce((sum, h) => sum + h.confidence, 0) / heuristics.length;
    const p = override ? (1 - avgConfidence) : avgConfidence;
    if (p <= 0 || p >= 1) return 0.0;
    return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
  }

  async logTrace(trace: CausalTrace): Promise<void> {
    const contextDir = `${PathResolver.from({}).archDir}/context`;
    await this.fileSystem.mkdir(contextDir);
    const logPath = `${contextDir}/trace-log.jsonl`;
    const line = JSON.stringify(trace) + '\n';
    await this.fileSystem.appendFile(logPath, line);
  }
}
