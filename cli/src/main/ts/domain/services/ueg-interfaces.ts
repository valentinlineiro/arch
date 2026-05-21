
import { UEGGraph, UEGGraphFragment } from '../models/ueg-ir.js';

export interface LanguageAdapter {
  language: string;
  supportedExtensions: string[];

  /**
   * Translates file syntax into UEG-IR primitives.
   * MUST NOT infer architecture or assign roles.
   */
  parse(file: string, content: string): Promise<UEGGraphFragment>;
}

export interface IRBuilder {
  /**
   * Merges multiple graph fragments into a single unified graph.
   * Enforces global uniqueness of Entity IDs and unions edges.
   * Preserves all behavioral signal sources separately (no averaging).
   */
  merge(fragments: UEGGraphFragment[], languageCoverage: string[]): UEGGraph;
}
