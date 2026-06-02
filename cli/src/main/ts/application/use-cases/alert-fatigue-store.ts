import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export type ThrottleAction = 'emit' | 'escalate' | 'halt' | 'skip';

export interface AlertFatigueRecord {
  category: string;
  consecutiveCount: number;
  lastTimestamp: string;
  lastAction: ThrottleAction;
}

const ESCALATE_AT = 3;
const HALT_AT = 5;

export class AlertFatigueStore {
  private readonly pathResolver: PathResolver;

  constructor(
    private fileSystem: FileSystem,
    private rootPath: string = '.',
    pathResolver?: PathResolver,
  ) {
    this.pathResolver = pathResolver ?? PathResolver.from({});
  }

  private get path(): string {
    return `${this.rootPath}/${this.pathResolver.archDir}/alert-fatigue.jsonl`;
  }

  private async readAll(): Promise<AlertFatigueRecord[]> {
    try {
      const raw = await this.fileSystem.readFile(this.path);
      return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as AlertFatigueRecord);
    } catch {
      return [];
    }
  }

  private async writeAll(records: AlertFatigueRecord[]): Promise<void> {
    await this.fileSystem.writeFile(this.path, records.map(r => JSON.stringify(r)).join('\n') + '\n');
  }

  async recordEmission(category: string): Promise<ThrottleAction> {
    const records = await this.readAll();
    const now = new Date().toISOString();
    const existing = records.find(r => r.category === category);

    if (existing) {
      const lastTime = new Date(existing.lastTimestamp).getTime();
      const isConsecutive = (Date.now() - lastTime) < 24 * 60 * 60 * 1000;
      if (isConsecutive) {
        existing.consecutiveCount++;
        existing.lastTimestamp = now;
      } else {
        existing.consecutiveCount = 1;
        existing.lastTimestamp = now;
      }
      const action = this.determineAction(existing.consecutiveCount);
      existing.lastAction = action;
      await this.writeAll(records);
      return action;
    }

    const newRecord: AlertFatigueRecord = {
      category,
      consecutiveCount: 1,
      lastTimestamp: now,
      lastAction: 'emit',
    };
    records.push(newRecord);
    await this.writeAll(records);
    return 'emit';
  }

  private determineAction(count: number): ThrottleAction {
    if (count >= HALT_AT) return 'halt';
    if (count === ESCALATE_AT) return 'escalate';
    if (count > ESCALATE_AT && count < HALT_AT) return 'skip';
    return 'emit';
  }

  async getAction(category: string): Promise<ThrottleAction | null> {
    const records = await this.readAll();
    const existing = records.find(r => r.category === category);
    if (!existing) return null;
    const lastTime = new Date(existing.lastTimestamp).getTime();
    const isConsecutive = (Date.now() - lastTime) < 24 * 60 * 60 * 1000;
    if (!isConsecutive) return 'emit';
    return this.determineAction(existing.consecutiveCount);
  }

  async reset(category: string): Promise<void> {
    const records = await this.readAll();
    const idx = records.findIndex(r => r.category === category);
    if (idx !== -1) {
      records.splice(idx, 1);
      await this.writeAll(records);
    }
  }
}
