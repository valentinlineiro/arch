import { Command } from '../domain/models/command.js';
import { NodeFileSystem } from '../infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from '../infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from '../infrastructure/cli/git-cli.js';
import { ChronicleEventRepository } from '../infrastructure/filesystem/chronicle-event-repository.js';
import { EventLogger } from '../domain/services/event-logger.js';
import { Reviewer } from '../domain/services/reviewer.js';
import { DriftChecker } from './use-cases/drift-checker.js';
import { SandboxService } from '../domain/services/sandbox.js';
import { HumanCoordinationService } from '../domain/services/human-coordination-service.js';
import { CausalSignalLog } from './use-cases/causal-signal-log.js';
import { TemporalIndex } from './use-cases/temporal-index.js';
import { ConfigLoader } from '../domain/services/config-loader.js';
import { CausalGraph } from './use-cases/causal-graph.js';
import { AskCorpus } from './use-cases/ask-corpus.js';

import { CheckCommand } from './commands/check-command.js';
import { InitCommand } from './commands/init-command.js';
import { VersionCommand } from './commands/version-command.js';
import { StatusCommand } from './commands/status-command.js';
import { CompileCommand } from './commands/compile-command.js';
import { TaskCommand } from './commands/task-command.js';
import { LoopCommand } from './commands/loop-command.js';
import { BatchCommand } from './commands/batch-command.js';
import { SandboxCommand } from './commands/sandbox-command.js';
import { MoveCommand } from './commands/move-command.js';
import { ExecCommand } from './commands/exec-command.js';
import { MergeResolveCommand } from './commands/merge-resolve-command.js';
import { VerifyAcsCommand } from './commands/verify-acs-command.js';
import { CaptureCommand } from './commands/capture-command.js';
import { GovernCommand } from './commands/govern-command.js';
import { AnalyzeCommand } from './commands/analyze-command.js';
import { ReportCommand } from './commands/report-command.js';
import { InboxCommand } from './commands/inbox-command.js';
import { ConductCommand } from './commands/conduct-command.js';
import { ServeCommand } from './commands/serve-command.js';
import { AskCommand } from './commands/ask-command.js';
import { TraceCommand } from './commands/trace-command.js';
import { IndexCommand } from './commands/index-command.js';
import { ExplainCommand } from './commands/explain-command.js';
import { DepsCommand } from './commands/deps-command.js';
import { SentinelCommand } from './commands/sentinel-command.js';
import { RankCommand } from './commands/rank-command.js';

import { getPublicTopLevel, getPublicEntriesByNamespace, type CommandEntry } from '../domain/services/command-registry.js';

export class CommandDispatcher {
  constructor(
    private fileSystem: NodeFileSystem,
    private taskRepository: MarkdownTaskRepository,
    private gitRepository: GitCli,
    private eventRepository: ChronicleEventRepository,
    private eventLogger: EventLogger,
    private reviewer: Reviewer,
    private sandboxService: SandboxService,
    private rootPath: string,
    private cliVersion: string,
    private driftChecker: DriftChecker,
    private humanCoordinationService: HumanCoordinationService,
    private causalSignalLog: CausalSignalLog,
    private temporalIndex: TemporalIndex
  ) {}

  async dispatch(name: string, args: string[]): Promise<void> {
    const command = await this.resolveCommand(name, args);
    if (command) {
      await command.execute(args);
    } else {
      this.showHelp();
      process.exit(1);
    }
  }

  private showHelp(): void {
    const publicTopLevel = getPublicTopLevel();
    const groups: Map<string, CommandEntry[]> = new Map();
    for (const ns of publicTopLevel) {
      const entries = getPublicEntriesByNamespace(ns);
      if (entries.length > 0) {
        groups.set(ns, entries);
      }
    }

    function sectionLabel(ns: string): string {
      const labels: Record<string, string> = {
        check: 'Core',
        status: 'Core',
        trace: 'Core',
        init: 'System',
        version: 'System',
        analyze: 'Governance & Analysis',
        govern: 'Governance & Analysis',
        task: 'Task Lifecycle',
        memory: 'Memory & Knowledge',
      };
      return labels[ns] ?? ns;
    }

    const lines: string[] = [];
    lines.push(`Usage: arch [${publicTopLevel.join('|')}]`);

    const nsGroups = new Map<string, { ns: string; entries: CommandEntry[] }[]>();
    for (const [ns, entries] of groups) {
      const label = sectionLabel(ns);
      if (!nsGroups.has(label)) nsGroups.set(label, []);
      nsGroups.get(label)!.push({ ns, entries });
    }

    for (const [label, namespaces] of nsGroups) {
      lines.push('');
      lines.push(`${label}:`);
      for (const { ns, entries } of namespaces) {
        const topEntry = entries.find(e => !e.subCommand);
        const subEntries = entries.filter(e => e.subCommand !== undefined);
        if (topEntry) {
          lines.push(`  arch ${ns.padEnd(22)} — ${topEntry.description}`);
        }
        for (const e of subEntries) {
          const full = e.name.replace('arch ', '');
          lines.push(`  arch ${full.padEnd(22)} — ${e.description}`);
        }
      }
    }

    console.log(lines.join('\n'));
  }

  private async resolveCommand(name: string, args: string[]): Promise<Command | null> {
    // ── Human-Centric Renaming ──────────────────────────────────────────────
    if (name === 'check') return new CheckCommand(this.taskRepository, this.gitRepository, this.reviewer, this.driftChecker, this.fileSystem);
    if (name === 'trace') return new TraceCommand(new CausalGraph(this.fileSystem, this.rootPath), {
      getArgs: () => args,
      log: (s) => console.log(s),
      error: (s) => console.error(s),
      exit: (code) => process.exit(code) as never,
    }, this.causalSignalLog);
    if (name === 'analyze') return new AnalyzeCommand(this.fileSystem, this.rootPath, this.taskRepository);

    // ── Standard Registry ───────────────────────────────────────────────────
    switch (name) {
      case 'review': // Keep for internal/transition if needed, or remove
        return new CheckCommand(this.taskRepository, this.gitRepository, this.reviewer, this.driftChecker, this.fileSystem);
      case 'init':
        return new InitCommand(this.rootPath);
      case 'version':
        return new VersionCommand(this.cliVersion);
      case 'status':
        return new StatusCommand(this.taskRepository, this.fileSystem, this.rootPath);
      case 'compile':
        return new CompileCommand(this.fileSystem);
      case 'sentinel':
        return new SentinelCommand(this.fileSystem);

      case 'task': {
        const sub = args[0];
        const subArgs = args.slice(1);
        if (sub === 'loop') return new LoopCommand(this.taskRepository, this.gitRepository, this.fileSystem, this.reviewer, this.driftChecker);
        if (sub === 'batch') return new BatchCommand(this.fileSystem);
        if (sub === 'drain') return { execute: async () => new BatchCommand(this.fileSystem).execute(['drain']) };
        if (sub === 'sandbox') return new SandboxCommand(this.sandboxService, this.taskRepository, this.fileSystem);
        if (sub === 'mv') return new MoveCommand(this.taskRepository, this.gitRepository, this.fileSystem);
        if (sub === 'exec') return new ExecCommand(this.taskRepository, this.fileSystem);
        if (sub === 'merge-resolve') return new MergeResolveCommand(this.gitRepository, this.fileSystem);
        if (sub === 'verify-acs') return new VerifyAcsCommand(this.taskRepository, this.rootPath);
        if (sub === 'capture') return new CaptureCommand(this.taskRepository, this.fileSystem, this.rootPath, this.gitRepository);
        
        let muriConfig;
        try {
          const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
          muriConfig = JSON.parse(configRaw).muri;
        } catch { /* use default */ }
        
        return new TaskCommand(this.taskRepository, this.reviewer, this.humanCoordinationService, this.fileSystem, this.rootPath, this.eventRepository, this.causalSignalLog, this.gitRepository, muriConfig, this.eventLogger, this.temporalIndex);
      }

      case 'govern': {
        const sub = args[0];
        if (sub === 'reflect') return new AnalyzeCommand(this.fileSystem, this.rootPath, this.taskRepository);
        if (sub === 'report') return new ReportCommand(this.fileSystem, this.gitRepository);
        if (sub === 'inbox') return new InboxCommand(this.taskRepository, this.fileSystem, this.reviewer, this.driftChecker);
        if (sub === 'conduct') return new ConductCommand();
        if (sub === 'serve') return new ServeCommand(this.rootPath);
        return new GovernCommand(this.taskRepository, this.gitRepository, this.fileSystem, this.causalSignalLog, this.rootPath);
      }

      case 'memory': {
        const sub = args[0];
        const subArgs = args.slice(1);
        if (sub === 'ask') return new AskCommand(new AskCorpus(this.fileSystem, this.rootPath, new CausalGraph(this.fileSystem, this.rootPath), this.temporalIndex), {
          getArgs: () => subArgs,
          log: (s) => console.log(s),
          error: (s) => console.error(s),
          exit: (code) => process.exit(code) as never,
        });
        if (sub === 'causal') return new TraceCommand(new CausalGraph(this.fileSystem, this.rootPath), {
          getArgs: () => subArgs,
          log: (s) => console.log(s),
          error: (s) => console.error(s),
          exit: (code) => process.exit(code) as never,
        }, this.causalSignalLog);
        if (sub === 'index') return new IndexCommand(this.fileSystem, this.gitRepository);
        if (sub === 'explain') return new ExplainCommand(this.taskRepository, this.fileSystem, this.causalSignalLog, this.rootPath);
        if (sub === 'deps') return new DepsCommand(this.taskRepository);
        return null;
      }
      
      default:
        return null;
    }
  }
}
