import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';

export type EscalationType = 'ANDON_HALT' | 'AWAITING_PROMOTION' | 'APPROVED' | 'REDIRECT' | 'SPRINT_CHECKPOINT';
export type EscalationStatus = 'OPEN' | 'RESOLVED';

export interface EscalationEntry {
  escalation_id: string;
  timestamp: string;
  type: EscalationType;
  subject: string;
  reason: string;
  status: EscalationStatus;
  resolved_at: string | null;
  resolved_by: string | null;
}

const ESCALATION_PATH = '.arch/escalations.jsonl';

export class EscalationStore {
  constructor(private fileSystem: FileSystem, private rootPath: string = '.') {}

  private get path(): string {
    return `${this.rootPath}/${ESCALATION_PATH}`;
  }

  async append(type: EscalationType, subject: string, reason: string): Promise<EscalationEntry> {
    const entry: EscalationEntry = {
      escalation_id: `ESC-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      type,
      subject,
      reason,
      status: 'OPEN',
      resolved_at: null,
      resolved_by: null,
    };
    await this.fileSystem.appendFile(this.path, JSON.stringify(entry) + '\n');
    return entry;
  }

  async resolve(escalationId: string, resolvedBy: string): Promise<void> {
    const entry: EscalationEntry = {
      escalation_id: escalationId,
      timestamp: new Date().toISOString(),
      type: 'ANDON_HALT',
      subject: '',
      reason: '',
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    };
    await this.fileSystem.appendFile(this.path, JSON.stringify(entry) + '\n');
  }

  async getOpen(): Promise<EscalationEntry[]> {
    let raw: string;
    try {
      raw = await this.fileSystem.readFile(this.path);
    } catch {
      return [];
    }

    const records = raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as EscalationEntry);
    const resolved = new Set(records.filter(r => r.status === 'RESOLVED').map(r => r.escalation_id));
    return records.filter(r => r.status === 'OPEN' && !resolved.has(r.escalation_id));
  }
  async getOpenByType(type: EscalationType): Promise<EscalationEntry[]> {
    const open = await this.getOpen();
    return open.filter(e => e.type === type);
  }

  async hasApproval(subject: string): Promise<boolean> {
    const approved = await this.getOpenByType('APPROVED');
    return approved.some(e => e.subject === subject);
  }

  async getOpenHalts(): Promise<EscalationEntry[]> {
    return this.getOpenByType('ANDON_HALT');
  }

}
