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

export interface TaskEntry {
  commitCount: number;
  lastCommitDate: string;                    // ISO committer date of most recent task-linked commit
  touchedFrequency: Record<string, number>;  // file path → commit count; unfiltered raw provenance
  recentCommitRefs: string[];                // short SHAs, bounded to MAX_COMMIT_REFS
  commitRefOverflow: boolean;                // true when commitCount > MAX_COMMIT_REFS
}

export interface ContextIndex {
  version: number;
  builtAt: string;
  files: Record<string, FileEntry>;
  adrs: Record<string, AdrEntry>;
  guidelines: Record<string, GuidelineEntry>;
  tasks: Record<string, TaskEntry>;
}
