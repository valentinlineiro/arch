import { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export interface DeepAnalysisState {
  lastDeepRunTick: number;
  lastDeepRunTimestamp: string;
}

const STATE_PATH = `${PathResolver.from({}).archDir}/deep-analysis-state.json`;

export async function readDeepAnalysisState(fs: FileSystem): Promise<DeepAnalysisState | null> {
  try {
    const content = await fs.readFile(STATE_PATH);
    return JSON.parse(content) as DeepAnalysisState;
  } catch {
    return null;
  }
}

export async function writeDeepAnalysisState(fs: FileSystem, state: DeepAnalysisState): Promise<void> {
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

export function isDeepAnalysisDue(state: DeepAnalysisState | null, currentTick: number, cadenceN: number): boolean {
  if (!state) return true;
  return (currentTick - state.lastDeepRunTick) >= cadenceN;
}
