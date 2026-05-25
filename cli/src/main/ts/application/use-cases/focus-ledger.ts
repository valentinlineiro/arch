import { PathResolver } from '../../domain/services/path-resolver.js';

export type RulingAction = 'FOCUS_ACQUIRED' | 'FOCUS_PRESERVED' | 'FOCUS_RELEASED' | 'INTEGRITY_FIX' | 'PROJECT_COMPLETE';

export interface FocusRuling {
  tick: number;
  taskId: string;
  action: RulingAction;
  previousTask?: string;
  timestamp: string;
}

export interface LedgerState {
  lastCommittedTick: number;
  rulings: FocusRuling[];
}

export const FOCUS_LEDGER_PATH = PathResolver.from({}).focusLedger;

export function parseLedger(content: string): LedgerState {
  const lines = content.trim().split('\n').filter(Boolean);
  let lastCommittedTick = 0;
  const rulings: FocusRuling[] = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.meta === true) {
        if (typeof entry.lastCommittedTick === 'number') {
          lastCommittedTick = entry.lastCommittedTick;
        }
      } else if (typeof entry.tick === 'number' && entry.taskId && entry.action) {
        rulings.push(entry as FocusRuling);
      }
    } catch { /* skip malformed */ }
  }
  return { lastCommittedTick, rulings };
}

export function committedRulings(state: LedgerState): FocusRuling[] {
  return state.rulings.filter(r => r.tick <= state.lastCommittedTick);
}

export function serializeLedger(rulings: FocusRuling[], lastCommittedTick: number): string {
  const header = JSON.stringify({ meta: true, lastCommittedTick });
  return [header, ...rulings.map(r => JSON.stringify(r))].join('\n') + '\n';
}
