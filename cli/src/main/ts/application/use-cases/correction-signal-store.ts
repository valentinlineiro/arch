import { randomUUID } from 'node:crypto';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export type CorrectionKind = 'factual' | 'style' | 'authority' | 'scope';
export type CorrectionAuthority = 'low' | 'medium' | 'high';
export type CorrectionSourceType = 'redirect' | 'operator_override';
export type CorrectionStatus = 'open' | 'corroborated' | 'promoted' | 'discarded';

export const HANSEI_CATEGORY_ALIASES: Record<string, string> = {
  sd: '[SpecDrift]',
  md: '[MissingDecisionRecord]',
  rd: '[RequirementsDeviation]',
  td: '[TestingDeficit]',
  od: '[ObservabilityGap]',
  ni: '[no-issue]',
};

export const HANSEI_CATEGORIES = [
  '[SpecDrift]',
  '[MissingDecisionRecord]',
  '[RequirementsDeviation]',
  '[TestingDeficit]',
  '[ObservabilityGap]',
  '[no-issue]',
];

export interface CorrectionSignal {
  signal_id: string;
  timestamp: string;
  source_type: CorrectionSourceType;
  task_ref: string;
  file_refs: string[];
  adr_refs: string[];
  category: string;
  correction_kind: CorrectionKind;
  summary: string;
  corroboration_count: number;
  authority: CorrectionAuthority;
  status: CorrectionStatus;
}

const CORRECTION_SIGNALS_PATH = `${PathResolver.from({}).archDir}/correction-signals.jsonl`;

export class CorrectionSignalStore {
  constructor(private fileSystem: FileSystem, private rootPath: string = '.') {}

  private get path(): string {
    return `${this.rootPath}/${CORRECTION_SIGNALS_PATH}`;
  }

  async append(signal: Omit<CorrectionSignal, 'signal_id' | 'timestamp' | 'corroboration_count' | 'status'>): Promise<CorrectionSignal> {
    const entry: CorrectionSignal = {
      signal_id: `CS-${randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      corroboration_count: 0,
      status: 'open',
      ...signal,
    };
    await this.fileSystem.appendFile(this.path, JSON.stringify(entry) + '\n');
    return entry;
  }

  async getAll(): Promise<CorrectionSignal[]> {
    try {
      const raw = await this.fileSystem.readFile(this.path);
      return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as CorrectionSignal);
    } catch {
      return [];
    }
  }

  static extractFileRefs(taskContent: string): string[] {
    const refs: string[] = [];
    const contextMatch = taskContent.match(/\*\*Files:\*\*([\s\S]*?)(?=\n\*\*|\n###|$)/);
    if (contextMatch) {
      const fileLines = contextMatch[1].matchAll(/^[-\s]+([\w./\-]+\.(?:ts|js|md|json))/gm);
      for (const m of fileLines) {
        if (m[1]) refs.push(m[1]);
      }
    }
    return refs;
  }

  static extractAdrRefs(taskContent: string): string[] {
    const adrPattern = /ADR-\d{3}/g;
    return [...new Set(taskContent.match(adrPattern) ?? [])];
  }

  static resolveCategory(input: string): string | null {
    const trimmed = input.trim().toLowerCase();
    if (HANSEI_CATEGORY_ALIASES[trimmed]) return HANSEI_CATEGORY_ALIASES[trimmed];
    const found = HANSEI_CATEGORIES.find(c => c.toLowerCase() === input.toLowerCase() || c.toLowerCase() === `[${input.toLowerCase()}]`);
    return found ?? null;
  }
}
