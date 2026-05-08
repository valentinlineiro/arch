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

export interface AdrTaskLinkTaskEntry {
  evidenceKinds: string[];
  taskPath?: string;
}

export interface AdrTaskLinkEntry {
  tasks: Record<string, AdrTaskLinkTaskEntry>;
}

export interface FailureEntry {
  id: string;
  sourceType: 'retro' | 'kaizen';
  sourceRef: string;
  title: string;
  keywords: string[];
  relatedTaskIds: string[];
  severityHint: 'high' | 'medium' | 'low';
}

export interface GuidelineFailureLinkEntry {
  failureIds: string[];
  evidenceKinds: string[];
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
  adrTaskLinks: Record<string, AdrTaskLinkEntry>;
  failures: Record<string, FailureEntry>;
  guidelineFailureLinks: Record<string, GuidelineFailureLinkEntry>;
  guidelines: Record<string, GuidelineEntry>;
  tasks: Record<string, TaskEntry>;
}
