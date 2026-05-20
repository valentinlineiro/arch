import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { CausalSignalLog } from './causal-signal-log.js';

const TEMPORAL_INDEX_PATH = '.arch/temporal-index.jsonl';
const DEFAULT_WINDOW = 20;
const DEFAULT_THRESHOLD = 3;

export interface TemporalRecord {
  taskId: string;
  timestamp: string;
  labels: string[];
}

export interface TemporalSpike {
  label: string;
  count: number;
  taskIds: string[];
}

export class TemporalIndex {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async append(taskId: string, labels: string[]): Promise<void> {
    const record: TemporalRecord = {
      taskId,
      timestamp: new Date().toISOString(),
      labels,
    };
    await this.fileSystem.appendFile(
      `${this.rootPath}/${TEMPORAL_INDEX_PATH}`,
      JSON.stringify(record) + '\n',
    );
  }

  async detectSpikes(window = DEFAULT_WINDOW, threshold = DEFAULT_THRESHOLD): Promise<TemporalSpike[]> {
    const entries = await this.readEntries();
    const recent = entries.slice(-window);
    const counts = new Map<string, string[]>();
    for (const entry of recent) {
      for (const label of entry.labels) {
        if (!counts.has(label)) counts.set(label, []);
        counts.get(label)!.push(entry.taskId);
      }
    }
    const spikes: TemporalSpike[] = [];
    for (const [label, taskIds] of counts) {
      if (taskIds.length >= threshold) {
        spikes.push({ label, count: taskIds.length, taskIds });
      }
    }
    return spikes.sort((a, b) => b.count - a.count);
  }

  async appendAndDetect(
    taskId: string,
    labels: string[],
    causalSignalLog?: Pick<CausalSignalLog, 'append'>,
    window = DEFAULT_WINDOW,
    threshold = DEFAULT_THRESHOLD,
  ): Promise<TemporalSpike[]> {
    await this.append(taskId, labels);
    const spikes = await this.detectSpikes(window, threshold);
    if (causalSignalLog && spikes.length > 0) {
      for (const spike of spikes) {
        await causalSignalLog.append({
          domain: 'epistemological',
          signal_type: 'create',
          candidate_from: taskId,
          candidate_relation: 'recurs_in',
          candidate_to: `pattern:${spike.label}`,
          confidence: 0.75,
          event: `temporal_spike:${spike.label}:${taskId}`,
        });
      }
    }
    return spikes;
  }

  private async readEntries(): Promise<TemporalRecord[]> {
    try {
      const raw = await this.fileSystem.readFile(`${this.rootPath}/${TEMPORAL_INDEX_PATH}`);
      return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as TemporalRecord);
    } catch {
      return [];
    }
  }
}
