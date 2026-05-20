import { type Phase1Event, SyntacticValidationService } from '../../domain/models/ontology.js';

export interface RawInputTrace {
  readonly origin: 'vcs' | 'log' | 'fs';
  readonly type: string;
  readonly payload: Record<string, any>;
}

export class NormalizeRepoEvents {
  /**
   * Normalizes raw, noisy repository input traces into a decontextualized,
   * ordered list of semantically inert Phase 1 events.
   * Enforces absolute time-blindness, local identity masking, and semantic validation.
   */
  public static normalize(rawTraces: RawInputTrace[]): Phase1Event[] {
    const events: Phase1Event[] = [];

    for (let i = 0; i < rawTraces.length; i++) {
      const trace = rawTraces[i];
      const eventId = String(i);

      // Determine the raw category
      let rawCategory: 'file_write' | 'process_event' | 'ci_event' | 'log_event' = 'log_event';
      if (trace.origin === 'fs') {
        rawCategory = 'file_write';
      } else if (trace.origin === 'vcs') {
        rawCategory = 'process_event';
      }

      // Determine the file class if applicable
      let fileClass: 'config_like' | 'code_like' | 'unknown' = 'unknown';
      const filePath = String(trace.payload.filePath || '').toLowerCase();
      if (filePath) {
        if (
          filePath.endsWith('.json') ||
          filePath.endsWith('.config') ||
          filePath.endsWith('.yaml') ||
          filePath.endsWith('.yml') ||
          filePath.endsWith('.toml') ||
          filePath.includes('config')
        ) {
          fileClass = 'config_like';
        } else if (
          filePath.endsWith('.ts') ||
          filePath.endsWith('.js') ||
          filePath.endsWith('.tsx') ||
          filePath.endsWith('.jsx') ||
          filePath.endsWith('.py') ||
          filePath.endsWith('.sh')
        ) {
          fileClass = 'code_like';
        }
      }

      // Perform local identity masking on metadata
      const cleanMetadata: Record<string, unknown> = {};
      if (trace.payload.commitHash) {
        cleanMetadata.commitHashHash = this.maskHash(trace.payload.commitHash);
      }
      if (trace.payload.author) {
        cleanMetadata.authorHash = this.maskHash(trace.payload.author);
      }
      if (trace.payload.actionKind) {
        cleanMetadata.actionKind = String(trace.payload.actionKind);
      }
      if (trace.payload.componentsCount !== undefined) {
        cleanMetadata.componentsCount = Number(trace.payload.componentsCount);
      }

      // Construct decontextualized event
      const event: Phase1Event = {
        event_id: eventId,
        event_type: `${rawCategory}_action`,
        attributes: {
          raw_category: rawCategory,
          exit_code: trace.payload.exitCode !== undefined ? Number(trace.payload.exitCode) : undefined,
          file_class: fileClass,
          metadata: cleanMetadata,
        },
      };

      // Enforce absolute semantic validation and time-blindness
      SyntacticValidationService.validateEvent(event);
      events.push(event);
    }

    return events;
  }

  /** Simple, irreversible masking helper to scrub names/hashes */
  private static maskHash(input: string): string {
    let hash = 0;
    const cleanInput = input.trim();
    for (let i = 0; i < cleanInput.length; i++) {
      hash = Math.imul(31, hash) + cleanInput.charCodeAt(i) | 0;
    }
    return `hash-${Math.abs(hash).toString(16)}`;
  }
}
