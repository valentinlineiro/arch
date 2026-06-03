/**
 * TemporalIndex — stubbed (TASK-1101).
 * Pattern detection removed. Enable via modules.patternDetection: true if needed.
 */
export interface TemporalSpike {
  category: string; count: number; taskIds: string[]; label: string;
}

export class TemporalIndex {
  constructor(_fileSystem?: unknown, _rootPath?: string) {}
  async appendAndDetect(_taskId: string, _categories: string[], _log?: unknown): Promise<TemporalSpike[]> { return []; }
  async detectSpikes(): Promise<TemporalSpike[]> { return []; }
}
