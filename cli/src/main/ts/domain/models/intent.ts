export enum IntentStatus {
  CAPTURED = 'CAPTURED',
  PROMOTED = 'PROMOTED',
  SIGNAL = 'SIGNAL',
  SUPERSEDED = 'SUPERSEDED',
  DISCARDED = 'DISCARDED',
}

export interface IntentOrigin {
  source: string;
  branch?: string;
  cwd?: string;
  triggeredBy: string;
  recentFiles: string[];
}

export interface Intent {
  id: string;
  schemaVersion: number;
  status: IntentStatus;
  createdAt: string;
  updatedAt: string;
  origin: IntentOrigin;
  interpretations: unknown[];
  promotedTo: string[];
  supersededBy: string[];
  rawIntent: string;
}
