import { Command, CommandExit, ioExit } from '../domain/models/command.js';
import { EscalationStore } from './use-cases/escalation-store.js';
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
import { ReviewCommand } from './commands/review-command.js';
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
import { AuditCommand } from './commands/audit-command.js';
import { ResumeCommand } from './commands/resume-command.js';
import { FixCommand } from './commands/fix-command.js';
import { TriageCommand } from './commands/triage-command.js';
import { ProjectCommand } from './commands/project-command.js';
import { CorpusImportCommand } from './commands/corpus-import-command.js';

import { getPublicTopLevel, getPublicEntriesByNamespace, resolveRoute, type CommandEntry } from '../domain/services/command-registry.js';

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

  async dispatch(name: string, args: string[]): Promise<number> {
    // Two-tier help
    if (name === 'help' || name === '--help' || name === '-h') {
      const full = args.includes('--full');
      this.showHelp(full);
      return 0;
    }

    const command = await this.resolveCommand(name, args);
    if (command) {
      try {
        return await command.execute(args);
      } catch (err) {
        if (err instanceof CommandExit) return err.code;
        throw err;
      }
    } else {
      this.showHelp();
      return 1;
    }
  }

  private showHelp(full = false): void {
    // Default (surface) help: 3 entry points only
    if (!full) {
      console.log('');
      console.log('  \x1b[32mARCH\x1b[0m — autonomous repository governance\n');
      console.log('  arch init              Set up ARCH in this repository');
      console.log('  arch review            Review repository health and governance status');
      console.log('  arch task capture      Capture a task, decision, or observation');
      console.log('');
      console.log('  \x1b[90march help --full       Show all commands\x1b[0m');
      console.log('');
      return;
    }

    // Full help: existing behaviour
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
    const route = resolveRoute(name, args);
    if (!route) return null;
    const key = route.subCommand ? `${route.name}:${route.subCommand}` : route.name;
    return (await this.builders[key]?.(route.remainingArgs)) ?? (await this.builders[route.name]?.(route.remainingArgs)) ?? null;
  }

  private builders: Record<string, (args: string[]) => Promise<Command | null>> = {
    'check': async () => new CheckCommand(this.taskRepository, this.gitRepository, this.reviewer, this.driftChecker, this.fileSystem),
    'trace': async (args) => new TraceCommand(new CausalGraph(this.fileSystem, this.rootPath), {
      getArgs: () => args, log: (s) => console.log(s), error: (s) => console.error(s), exit: (code) => ioExit(code),
    }, this.causalSignalLog),
    'analyze': async () => new AnalyzeCommand(this.fileSystem, this.rootPath, this.taskRepository),
    'review': async () => new ReviewCommand(this.taskRepository, this.gitRepository, this.fileSystem),
    'init': async () => new InitCommand(this.rootPath, this.cliVersion),
    'project': async () => new ProjectCommand(this.fileSystem, this.taskRepository, this.rootPath),
    'version': async () => new VersionCommand(this.cliVersion),
    'status': async () => new StatusCommand(this.taskRepository, this.fileSystem, this.rootPath),
    'compile': async () => new CompileCommand(this.fileSystem),
    'sentinel': async () => new SentinelCommand(this.fileSystem),
    'audit': async () => new AuditCommand(),
    'fix': async () => new FixCommand(this.fileSystem, this.rootPath),
    'triage': async () => new TriageCommand(this.fileSystem, this.rootPath),
    'resume': async () => new ResumeCommand(this.fileSystem, this.gitRepository, this.taskRepository, this.rootPath),

    'task:loop': async () => new LoopCommand(this.taskRepository, this.gitRepository, this.fileSystem, this.reviewer, this.driftChecker),
    'task:batch': async () => new BatchCommand(this.fileSystem),
    'task:drain': async () => ({ execute: async () => new BatchCommand(this.fileSystem).execute(['drain']) }),
    'task:sandbox': async () => new SandboxCommand(this.sandboxService, this.taskRepository, this.fileSystem),
    'task:mv': async () => new MoveCommand(this.taskRepository, this.gitRepository, this.fileSystem),
    'task:exec': async () => new ExecCommand(this.taskRepository, this.fileSystem),
    'task:merge-resolve': async () => new MergeResolveCommand(this.gitRepository, this.fileSystem),
    'task:verify-acs': async () => new VerifyAcsCommand(this.taskRepository, this.rootPath),
    'task:capture': async () => new CaptureCommand(this.taskRepository, this.fileSystem, this.rootPath, this.gitRepository),
    'task': async (_args) => {
      let muriConfig;
      try {
        const configRaw = await this.fileSystem.readFile(`${this.rootPath}/arch.config.json`);
        muriConfig = JSON.parse(configRaw).muri;
      } catch { /* use default */ }
      return new TaskCommand(this.taskRepository, this.reviewer, this.humanCoordinationService, this.fileSystem, this.rootPath, this.eventRepository, this.causalSignalLog, this.gitRepository, muriConfig, this.eventLogger, this.temporalIndex);
    },
    'govern:reflect': async () => new AnalyzeCommand(this.fileSystem, this.rootPath, this.taskRepository),
    'govern:report': async () => new ReportCommand(this.fileSystem, this.gitRepository),
    'govern:inbox': async () => new InboxCommand(this.taskRepository, this.fileSystem, this.reviewer, this.driftChecker),
    'govern:conduct': async () => new ConductCommand(),
    'govern:serve': async () => new ServeCommand(this.rootPath),
    'govern:compact-escalations': async () => {
      const store = new EscalationStore(this.fileSystem, this.rootPath);
      return { execute: async () => { const { before, after } = await store.compact(); console.log(`\n  Escalation compaction: ${before} → ${after} records (removed ${before - after} duplicates)\n`); return 0; } } as any;
    },
    'govern': async () => new GovernCommand(this.taskRepository, this.gitRepository, this.fileSystem, this.causalSignalLog, this.rootPath),
    'memory:ask': async (args) => new AskCommand(new AskCorpus(this.fileSystem, this.rootPath, new CausalGraph(this.fileSystem, this.rootPath), this.temporalIndex), {
      getArgs: () => args, log: (s) => console.log(s), error: (s) => console.error(s), exit: (code) => ioExit(code),
    }),
    'memory:causal': async (args) => new TraceCommand(new CausalGraph(this.fileSystem, this.rootPath), {
      getArgs: () => args, log: (s) => console.log(s), error: (s) => console.error(s), exit: (code) => ioExit(code),
    }, this.causalSignalLog),
    'memory:index': async () => new IndexCommand(this.fileSystem, this.gitRepository),
    'memory:explain': async () => new ExplainCommand(this.taskRepository, this.fileSystem, this.causalSignalLog, this.rootPath),
    'memory:deps': async () => new DepsCommand(this.taskRepository),
    'corpus:import': async () => new CorpusImportCommand(this.fileSystem),
  };
}
