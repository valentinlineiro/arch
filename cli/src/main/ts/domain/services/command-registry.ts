export type CommandVisibility = 'public' | 'internal' | 'deprecated' | 'experimental';

export interface CommandEntry {
  name: string; // full qualified: "arch memory ask"
  topLevel: string; // first segment: "memory"
  subCommand?: string; // second segment: "ask"
  visibility: CommandVisibility;
  description: string;
  category?: string; // for grouping in help output
  aliases?: string[]; // deprecated aliases
}

export const COMMAND_REGISTRY: CommandEntry[] = [
  // ── Core ─────────────────────────────────────────────────────────────────────
  {
    name: 'arch check',
    topLevel: 'check',
    visibility: 'public',
    description: 'structural validation, integrity audit, and auto-fix',
    category: 'Core',
  },
  {
    name: 'arch status',
    topLevel: 'status',
    visibility: 'public',
    description: 'high-level sprint and task progress',
    category: 'Core',
  },
  {
    name: 'arch trace',
    topLevel: 'trace',
    visibility: 'public',
    description: 'show causal edges and task/ADR provenance',
    category: 'Core',
  },
  {
    name: 'arch review',
    topLevel: 'review',
    visibility: 'public',
    description: 'interactive review queue — verify ACs, approve or skip REVIEW tasks',
    category: 'Core',
  },
  {
    name: 'arch init',
    topLevel: 'init',
    visibility: 'public',
    description: 'initialize ARCH in current repository (--guided for interactive setup)',
    category: 'System',
  },
  {
    name: 'arch version',
    topLevel: 'version',
    visibility: 'public',
    description: 'show CLI version',
    category: 'System',
  },

  // ── Task Lifecycle ───────────────────────────────────────────────────────────
  {
    name: 'arch task start',
    topLevel: 'task',
    subCommand: 'start',
    visibility: 'public',
    description: 'start a task (interactive if ID omitted)',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task review',
    topLevel: 'task',
    subCommand: 'review',
    visibility: 'public',
    description: 'run predicates and move to REVIEW',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task done',
    topLevel: 'task',
    subCommand: 'done',
    visibility: 'public',
    description: 'archive completed task (launches Hansei wizard)',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task create',
    topLevel: 'task',
    subCommand: 'create',
    visibility: 'public',
    description: 'scaffold new task from intent',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task capture',
    topLevel: 'task',
    subCommand: 'capture',
    visibility: 'public',
    description: 'capture, scaffold, and start in one step',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task edit',
    topLevel: 'task',
    subCommand: 'edit',
    visibility: 'public',
    description: 'interactively update task metadata',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task reprioritize',
    topLevel: 'task',
    subCommand: 'reprioritize',
    visibility: 'public',
    description: 'corpus-informed priority diff',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task next',
    topLevel: 'task',
    subCommand: 'next',
    visibility: 'public',
    description: 'suggest next highest-priority task',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task rank',
    topLevel: 'task',
    subCommand: 'rank',
    visibility: 'public',
    description: 'rank READY tasks by priority and size',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task promote',
    topLevel: 'task',
    subCommand: 'promote',
    visibility: 'public',
    description: 'promote an IDEA to a TASK',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task reject',
    topLevel: 'task',
    subCommand: 'reject',
    visibility: 'public',
    description: 'move a task back to READY',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task approve',
    topLevel: 'task',
    subCommand: 'approve',
    visibility: 'public',
    description: 'human approval gate',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task redirect',
    topLevel: 'task',
    subCommand: 'redirect',
    visibility: 'public',
    description: 'redirect with new instruction',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task split',
    topLevel: 'task',
    subCommand: 'split',
    visibility: 'public',
    description: 'decompose an L/XL task into sub-tasks',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task compress',
    topLevel: 'task',
    subCommand: 'compress',
    visibility: 'public',
    description: 'lossy-compress archive files',
    category: 'Task Lifecycle',
  },
  {
    name: 'arch task hansei',
    topLevel: 'task',
    subCommand: 'hansei',
    visibility: 'public',
    description: 'interactive Hansei wizard — reads diff, prompts for fields, writes ## Hansei block',
    category: 'Task Lifecycle',
  },

  // ── Task internals (access via task subcommand only) ─────────────────────────
  {
    name: 'arch task loop',
    topLevel: 'task',
    subCommand: 'loop',
    visibility: 'internal',
    description: 'interactive task loop runner',
    category: 'Task Internals',
  },
  {
    name: 'arch task batch',
    topLevel: 'task',
    subCommand: 'batch',
    visibility: 'internal',
    description: 'batch mode operations',
    category: 'Task Internals',
  },
  {
    name: 'arch task drain',
    topLevel: 'task',
    subCommand: 'drain',
    visibility: 'internal',
    description: 'drain batch queue',
    category: 'Task Internals',
  },
  {
    name: 'arch task sandbox',
    topLevel: 'task',
    subCommand: 'sandbox',
    visibility: 'internal',
    description: 'sandboxed task execution',
    category: 'Task Internals',
  },
  {
    name: 'arch task mv',
    topLevel: 'task',
    subCommand: 'mv',
    visibility: 'internal',
    description: 'move task file',
    category: 'Task Internals',
  },
  {
    name: 'arch task exec',
    topLevel: 'task',
    subCommand: 'exec',
    visibility: 'internal',
    description: 'execute task script',
    category: 'Task Internals',
  },
  {
    name: 'arch task merge-resolve',
    topLevel: 'task',
    subCommand: 'merge-resolve',
    visibility: 'internal',
    description: 'resolve merge conflicts',
    category: 'Task Internals',
  },
  {
    name: 'arch task verify-acs',
    topLevel: 'task',
    subCommand: 'verify-acs',
    visibility: 'internal',
    description: 'verify task ACs',
    category: 'Task Internals',
  },

  // ── Governance & Analysis ────────────────────────────────────────────────────
  {
    name: 'arch govern',
    topLevel: 'govern',
    visibility: 'public',
    description: 'run governance tick (archive DONE, assign focus)',
    category: 'Governance & Analysis',
  },
  {
    name: 'arch govern inbox',
    topLevel: 'govern',
    subCommand: 'inbox',
    visibility: 'public',
    description: 'show urgent actions and refinement queue',
    category: 'Governance & Analysis',
  },
  {
    name: 'arch analyze',
    topLevel: 'analyze',
    visibility: 'public',
    description: 'trigger THINK mode for pattern analysis',
    category: 'Governance & Analysis',
  },
  {
    name: 'arch govern serve',
    topLevel: 'govern',
    subCommand: 'serve',
    visibility: 'public',
    description: 'launch local visual dashboard (localhost:3000)',
    category: 'Governance & Analysis',
  },
  {
    name: 'arch govern report',
    topLevel: 'govern',
    subCommand: 'report',
    visibility: 'public',
    description: 'governance decision report',
    category: 'Governance & Analysis',
  },
  {
    name: 'arch govern conduct',
    topLevel: 'govern',
    subCommand: 'conduct',
    visibility: 'public',
    description: 'interactive governance session',
    category: 'Governance & Analysis',
  },
  {
    name: 'arch govern approve',
    topLevel: 'govern',
    subCommand: 'approve',
    visibility: 'public',
    description: 'human approval gate for blocked tasks',
    category: 'Governance & Analysis',
  },

  // ── Memory & Knowledge ───────────────────────────────────────────────────────
  {
    name: 'arch memory ask',
    topLevel: 'memory',
    subCommand: 'ask',
    visibility: 'public',
    description: 'query the causal graph and task archive',
    category: 'Memory & Knowledge',
  },
  {
    name: 'arch memory index',
    topLevel: 'memory',
    subCommand: 'index',
    visibility: 'public',
    description: 'rebuild the context index',
    category: 'Memory & Knowledge',
  },
  {
    name: 'arch memory explain',
    topLevel: 'memory',
    subCommand: 'explain',
    visibility: 'public',
    description: 'look up an ARCH ontology term or task provenance',
    category: 'Memory & Knowledge',
  },
  {
    name: 'arch memory deps',
    topLevel: 'memory',
    subCommand: 'deps',
    visibility: 'public',
    description: 'show task dependencies',
    category: 'Memory & Knowledge',
  },

  // ── System Internals ─────────────────────────────────────────────────────────
  {
    name: 'arch audit',
    topLevel: 'audit',
    visibility: 'internal',
    description: 'run integrity audit',
    category: 'System Internals',
  },
  {
    name: 'arch corpus audit',
    topLevel: 'corpus',
    subCommand: 'audit',
    visibility: 'internal',
    description: 'audit corpus completeness',
    category: 'System Internals',
  },
  {
    name: 'arch sentinel',
    topLevel: 'sentinel',
    visibility: 'internal',
    description: 'system sentinel monitor',
    category: 'System Internals',
  },
  {
    name: 'arch compile',
    topLevel: 'compile',
    visibility: 'internal',
    description: 'compile telemetry stream (internal)',
    category: 'System Internals',
  },
];

export function getTopLevelCommands(): string[] {
  return [...new Set(COMMAND_REGISTRY.map(e => e.topLevel))].sort();
}

export function getPublicTopLevel(): string[] {
  return [
    ...new Set(
      COMMAND_REGISTRY
        .filter(e => e.visibility === 'public')
        .map(e => e.topLevel)
    ),
  ].sort();
}

export function getEntriesByNamespace(ns: string): CommandEntry[] {
  return COMMAND_REGISTRY.filter(e => e.topLevel === ns);
}

export function getPublicEntriesByNamespace(ns: string): CommandEntry[] {
  return COMMAND_REGISTRY.filter(e => e.topLevel === ns && e.visibility === 'public');
}

export function getEntry(name: string): CommandEntry | undefined {
  return COMMAND_REGISTRY.find(e => e.name === name);
}

export function getSubCommands(ns: string): CommandEntry[] {
  return COMMAND_REGISTRY.filter(e => e.topLevel === ns && e.subCommand !== undefined);
}

export function getPublicSubCommands(ns: string): CommandEntry[] {
  return COMMAND_REGISTRY.filter(e => e.topLevel === ns && e.subCommand !== undefined && e.visibility === 'public');
}