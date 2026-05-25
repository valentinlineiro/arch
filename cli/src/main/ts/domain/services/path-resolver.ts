const DEFAULTS = {
  tasks: 'docs/tasks',
  archive: 'docs/archive',
  adr: 'docs/adr',
  inbox: 'docs/INBOX.md',
  guidelines: 'docs/guidelines',
  agents: 'docs/agents',
  refinement: 'docs/refinement',
  refinementArchive: 'docs/refinement/archive',
  events: 'docs/EVENTS.md',
  archDir: '.arch',
  statusProjection: '.arch/status-projection.json',
  focusLedger: '.arch/focus-ledger.jsonl',
  contextIndex: '.arch/context-index.json',
  corpusIndex: '.arch/corpus-index.json',
  escalations: '.arch/escalations.jsonl',
} as const;

type PathKey = keyof typeof DEFAULTS;

export class PathResolver {
  private readonly paths: Record<PathKey, string>;

  constructor(config: Record<string, any>) {
    const overrides: Partial<Record<PathKey, string>> = config?.paths ?? {};
    this.paths = {} as Record<PathKey, string>;
    for (const key of Object.keys(DEFAULTS) as PathKey[]) {
      this.paths[key] = overrides[key] ?? DEFAULTS[key];
    }
  }

  static from(config: Record<string, any>): PathResolver {
    return new PathResolver(config);
  }

  get tasks(): string            { return this.paths.tasks; }
  get archive(): string          { return this.paths.archive; }
  get adr(): string              { return this.paths.adr; }
  get inbox(): string            { return this.paths.inbox; }
  get guidelines(): string       { return this.paths.guidelines; }
  get agents(): string           { return this.paths.agents; }
  get refinement(): string       { return this.paths.refinement; }
  get refinementArchive(): string { return this.paths.refinementArchive; }
  get events(): string           { return this.paths.events; }
  get archDir(): string          { return this.paths.archDir; }
  get statusProjection(): string { return this.paths.statusProjection; }
  get focusLedger(): string      { return this.paths.focusLedger; }
  get contextIndex(): string     { return this.paths.contextIndex; }
  get corpusIndex(): string      { return this.paths.corpusIndex; }
  get escalations(): string      { return this.paths.escalations; }
}
