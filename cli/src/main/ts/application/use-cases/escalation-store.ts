import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

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

export class EscalationStore {
  private readonly pathResolver: PathResolver;

  constructor(
    private fileSystem: FileSystem,
    private rootPath: string = '.',
    pathResolver?: PathResolver
  ) {
    this.pathResolver = pathResolver ?? PathResolver.from({});
  }

  private get path(): string {
    return `${this.rootPath}/${this.pathResolver.escalations}`;
  }

  async append(type: EscalationType, subject: string, reason: string): Promise<EscalationEntry | null> {
    // Deduplication: read last 100 lines, skip if OPEN record for same (subject, type) within 24h
    try {
      const raw = await this.fileSystem.readFile(this.path);
      const lines = raw.trim().split('\n').filter(Boolean);
      const tail = lines.slice(-100);
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      for (const line of tail) {
        try {
          const rec = JSON.parse(line) as EscalationEntry;
          if (rec.status === 'OPEN' && rec.type === type && rec.subject === subject
              && new Date(rec.timestamp).getTime() > cutoff) {
            return null; // Duplicate — skip
          }
        } catch { /* skip malformed line */ }
      }
    } catch { /* file doesn't exist yet — first write */ }

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

  /**
   * Compact: deduplicate OPEN records by (subject, type), keeping only the
   * most recent. RESOLVED records are preserved as-is (audit trail).
   */
  async compact(): Promise<{ before: number; after: number }> {
    let raw: string;
    try { raw = await this.fileSystem.readFile(this.path); }
    catch { return { before: 0, after: 0 }; }

    const lines = raw.trim().split('\n').filter(Boolean);
    const before = lines.length;

    // Parse all records
    const records = lines.map(l => { try { return JSON.parse(l) as EscalationEntry; } catch { return null; } }).filter(Boolean) as EscalationEntry[];

    // Keep all RESOLVED records (audit trail)
    const resolved = records.filter(r => r.status === 'RESOLVED');

    // For OPEN records: keep only most recent per (subject, type)
    const openMap = new Map<string, EscalationEntry>();
    for (const r of records.filter(r => r.status === 'OPEN')) {
      const key = `${r.type}::${r.subject}`;
      const existing = openMap.get(key);
      if (!existing || new Date(r.timestamp) > new Date(existing.timestamp)) {
        openMap.set(key, r);
      }
    }

    const compacted = [...resolved, ...openMap.values()]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    await this.fileSystem.writeFile(this.path, compacted.map(r => JSON.stringify(r)).join('\n') + '\n');
    return { before, after: compacted.length };
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
