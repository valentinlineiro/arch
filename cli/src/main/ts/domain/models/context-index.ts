export interface FileEntry {
  symbols: string[];
  imports: string[];
  tags: string[];
  criticality: 'core' | 'domain' | 'support' | 'utility';
  runtimeUsage: 'hot' | 'warm' | 'cold';
}

export interface AdrEntry {
  title: string;
  keywords: string[];
  affectedModules: string[];
  strength: 'enforced' | 'advisory';
}

export interface GuidelineEntry {
  tags: string[];
  taskClasses: string[];
}

export interface ContextIndex {
  version: number;
  builtAt: string;
  files: Record<string, FileEntry>;
  adrs: Record<string, AdrEntry>;
  guidelines: Record<string, GuidelineEntry>;
}
