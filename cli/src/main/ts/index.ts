
import path from 'node:path';
import { createRequire } from 'node:module';
import { NodeFileSystem } from './infrastructure/filesystem/node-file-system.js';
import { MarkdownTaskRepository } from './infrastructure/filesystem/markdown-task-repository.js';
import { GitCli } from './infrastructure/cli/git-cli.js';
import { EventLogger } from './domain/services/event-logger.js';
import { Reviewer } from './domain/services/reviewer.js';
import { DriftChecker } from './application/use-cases/drift-checker.js';
import { parseCommand } from './infrastructure/cli/command-parser.js';
import { ValidateCommand } from './application/commands/validate-command.js';
import { ReviewCommand } from './application/commands/review-command.js';
import { TaskCommand } from './application/commands/task-command.js';
import { InboxCommand } from './application/commands/inbox-command.js';
import { NextCommand } from './application/commands/next-command.js';
import { VersionCommand } from './application/commands/version-command.js';
import { GovernCommand } from './application/commands/govern-command.js';
import { RankCommand } from './application/commands/rank-command.js';
import { BatchCommand } from './application/commands/batch-command.js';
import { ConductCommand } from './application/commands/conduct-command.js';
import { PromoteCommand } from './application/commands/promote-command.js';
import { LoopCommand } from './application/commands/loop-command.js';
import { SandboxCommand } from './application/commands/sandbox-command.js';
import { SandboxService } from './domain/services/sandbox.js';
import { HumanCoordinationService } from './domain/services/human-coordination-service.js';
import { LintCommand } from './application/commands/lint-command.js';
import { MoveCommand } from './application/commands/move-command.js';
import { ExecCommand } from './application/commands/exec-command.js';
import { MergeResolveCommand } from './application/commands/merge-resolve-command.js';
import { IndexCommand } from './application/commands/index-command.js';
import { ChronicleEventRepository } from './infrastructure/filesystem/chronicle-event-repository.js';
import { AskCommand } from './application/commands/ask-command.js';
import { AskCorpus } from './application/use-cases/ask-corpus.js';
import { CausalCommand } from './application/commands/causal-command.js';
import { CausalGraph } from './application/use-cases/causal-graph.js';
import { CausalSignalLog } from './application/use-cases/causal-signal-log.js';
import { ReflectCommand } from './application/commands/reflect-command.js';
import { ReportCommand } from './application/commands/report-command.js';
import { InitCommand } from './application/commands/init-command.js';
import { VerifyAcsCommand } from './application/commands/verify-acs-command.js';
import { StatusCommand } from './application/commands/status-command.js';
import { ServeCommand } from './application/commands/serve-command.js';
import { CaptureCommand } from './application/commands/capture-command.js';
import { ExplainCommand } from './application/commands/explain-command.js';
import { DepsCommand } from './application/commands/deps-command.js';

function deprecated(old: string, canonical: string): void {
  process.stderr.write(`Warning: 'arch ${old}' is deprecated. Use 'arch ${canonical}' instead.\n`);
}

async function main() {
  const fileSystem = new NodeFileSystem();
  const taskRepository = new MarkdownTaskRepository(fileSystem);
  const gitRepository = new GitCli();
  const eventRepository = new ChronicleEventRepository(fileSystem);
  const eventLogger = new EventLogger(fileSystem, gitRepository);
  const reviewer = new Reviewer();
  const sandboxService = new SandboxService();
  const rootPath = path.resolve('.');
  const require = createRequire(import.meta.url);
  const { version: cliVersion } = require('../package.json') as { version: string };
  const driftChecker = new DriftChecker(fileSystem, gitRepository, rootPath, cliVersion);
  const humanCoordinationService = new HumanCoordinationService(taskRepository, gitRepository);
  const causalSignalLog = new CausalSignalLog(fileSystem, rootPath);

  const { name, args } = parseCommand(process.argv.slice(2));

  if (name === '--version' || name === '-v') {
    await new VersionCommand(cliVersion).execute();
    return;
  }

  switch (name) {
    // ── Core ──────────────────────────────────────────────────────────────────
    case 'review':
      await new ReviewCommand(taskRepository, gitRepository, reviewer, driftChecker, fileSystem).execute(args);
      break;

    case 'init':
      await new InitCommand(rootPath).execute(args);
      break;

    case 'version':
      await new VersionCommand(cliVersion).execute();
      break;

    case 'status':
      await new StatusCommand(taskRepository, fileSystem, rootPath).execute();
      break;

    // ── arch task <subcommand> ────────────────────────────────────────────────
    case 'task': {
      const sub = args[0];
      if (sub === 'loop') {
        await new LoopCommand(taskRepository, gitRepository, fileSystem, reviewer, driftChecker).execute(args.slice(1));
      } else if (sub === 'batch') {
        await new BatchCommand(fileSystem).execute(args.slice(1));
      } else if (sub === 'drain') {
        await new BatchCommand(fileSystem).execute(['drain']);
      } else if (sub === 'sandbox') {
        await new SandboxCommand(sandboxService, taskRepository, fileSystem).execute(args.slice(1));
      } else if (sub === 'mv') {
        await new MoveCommand(taskRepository, gitRepository, fileSystem).execute(args.slice(1));
      } else if (sub === 'exec') {
        await new ExecCommand(taskRepository, fileSystem).execute(args.slice(1));
      } else if (sub === 'merge-resolve') {
        await new MergeResolveCommand(gitRepository, fileSystem).execute();
      } else if (sub === 'verify-acs') {
        await new VerifyAcsCommand(taskRepository, rootPath).execute(args.slice(1));
      } else if (sub === 'capture') {
        await new CaptureCommand(taskRepository, fileSystem, rootPath, gitRepository).execute(args.slice(1));
      } else {
        let muriConfig;
        try {
          const configRaw = await fileSystem.readFile(`${rootPath}/arch.config.json`);
          muriConfig = JSON.parse(configRaw).muri;
        } catch { /* use default */ }
        await new TaskCommand(taskRepository, reviewer, humanCoordinationService, fileSystem, rootPath, eventRepository, causalSignalLog, gitRepository, muriConfig, eventLogger).execute(args);
      }
      break;
    }

    // ── arch govern [subcommand] ──────────────────────────────────────────────
    case 'govern': {
      const sub = args[0];
      if (sub === 'reflect') {
        await new ReflectCommand(fileSystem, rootPath, taskRepository).execute(args.slice(1));
      } else if (sub === 'report') {
        await new ReportCommand(fileSystem, gitRepository).execute();
      } else if (sub === 'inbox') {
        await new InboxCommand(taskRepository, fileSystem, reviewer, driftChecker).execute(args.slice(1));
      } else if (sub === 'conduct') {
        await new ConductCommand().execute(args.slice(1));
      } else if (sub === 'approve') {
        const approveTaskId = args[1];
        if (!approveTaskId || !/^TASK-\d+$/.test(approveTaskId)) {
          console.error('Usage: arch govern approve TASK-XXX');
          process.exit(1);
        }
        const { EscalationStore } = await import('./application/use-cases/escalation-store.js');
        const approveStore = new EscalationStore(fileSystem, rootPath);
        await approveStore.append('APPROVED', approveTaskId, `Human approval granted via arch govern approve.`);
        console.log(`  ✔ Approved ${approveTaskId}. Run arch task loop --resume to continue.`);
      } else if (sub === 'serve') {
        await new ServeCommand(rootPath).execute(args.slice(1));
      } else {
        await new GovernCommand(taskRepository, gitRepository, fileSystem, causalSignalLog, rootPath).execute(args);
      }
      break;
    }

    // ── arch memory <subcommand> ──────────────────────────────────────────────
    case 'memory': {
      const sub = args[0];
      const subArgs = args.slice(1);
      if (sub === 'ask') {
        await new AskCommand(new AskCorpus(fileSystem, rootPath, new CausalGraph(fileSystem, rootPath)), {
          getArgs: () => subArgs,
          log: (s) => console.log(s),
          error: (s) => console.error(s),
          exit: (code) => process.exit(code) as never,
        }).execute();
      } else if (sub === 'causal') {
        const causalGraph = new CausalGraph(fileSystem, rootPath);
        await new CausalCommand(causalGraph, {
          getArgs: () => subArgs,
          log: (s) => console.log(s),
          error: (s) => console.error(s),
          exit: (code) => process.exit(code) as never,
        }, causalSignalLog).execute();
      } else if (sub === 'index') {
        await new IndexCommand(fileSystem, gitRepository).execute();
      } else if (sub === 'explain') {
        await new ExplainCommand(taskRepository, fileSystem, causalSignalLog, rootPath).execute(subArgs);
      } else if (sub === 'deps') {
        await new DepsCommand(taskRepository).execute(subArgs);
      } else {
        console.log('Usage: arch memory [ask|causal|index|explain|deps]');
        process.exit(1);
      }
      break;
    }

    // ── Legacy aliases (deprecated) ───────────────────────────────────────────
    case 'validate':
      deprecated('validate', 'review');
      await new ValidateCommand(taskRepository, fileSystem, rootPath).execute(args);
      break;

    case 'lint':
      deprecated('lint', 'review');
      await new LintCommand(taskRepository, fileSystem).execute(args);
      break;

    case 'next': {
      deprecated('next', 'task next');
      let muriConfig;
      try {
        const configRaw = await fileSystem.readFile(`${rootPath}/arch.config.json`);
        muriConfig = JSON.parse(configRaw).muri;
      } catch { /* use default */ }
      await new NextCommand(taskRepository, args, muriConfig, fileSystem, rootPath).execute();
      break;
    }

    case 'rank':
      deprecated('rank', 'task rank');
      await new RankCommand(taskRepository).execute();
      break;

    case 'promote':
      deprecated('promote', 'task promote');
      await new PromoteCommand(taskRepository, gitRepository, fileSystem).execute(args);
      break;

    case 'loop':
      deprecated('loop', 'task loop');
      await new LoopCommand(taskRepository, gitRepository, fileSystem, reviewer, driftChecker).execute(args);
      break;

    case 'batch':
      deprecated('batch', 'task batch');
      await new BatchCommand(fileSystem).execute(args);
      break;

    case 'drain':
      deprecated('drain', 'task drain');
      await new BatchCommand(fileSystem).execute(['drain']);
      break;

    case 'conduct':
      deprecated('conduct', 'govern conduct');
      await new ConductCommand().execute(args);
      break;

    case 'sandbox':
      deprecated('sandbox', 'task sandbox');
      await new SandboxCommand(sandboxService, taskRepository, fileSystem).execute(args);
      break;

    case 'mv':
      deprecated('mv', 'task mv');
      await new MoveCommand(taskRepository, gitRepository, fileSystem).execute(args);
      break;

    case 'exec':
      deprecated('exec', 'task exec');
      await new ExecCommand(taskRepository, fileSystem).execute(args);
      break;

    case 'merge-resolve':
      deprecated('merge-resolve', 'task merge-resolve');
      await new MergeResolveCommand(gitRepository, fileSystem).execute();
      break;

    case 'verify-acs':
      deprecated('verify-acs', 'task verify-acs');
      await new VerifyAcsCommand(taskRepository, rootPath).execute(args);
      break;

    case 'corpus': {
      if (args[0] === 'audit') {
        const { CorpusAuditCommand } = await import('./application/commands/corpus-audit-command.js');
        await new CorpusAuditCommand(fileSystem, gitRepository, rootPath).execute(args.slice(1));
      } else {
        console.error('Usage: arch corpus audit [--verbose]');
        process.exit(1);
      }
      break;
    }
    case 'capture': {
      deprecated('capture', 'task capture');
      const { CaptureCommand } = await import('./application/commands/capture-command.js');
      await new CaptureCommand(taskRepository, fileSystem, rootPath, gitRepository).execute(args);
      break;
    }

    case 'inbox':
      deprecated('inbox', 'govern inbox');
      await new InboxCommand(taskRepository, fileSystem, reviewer, driftChecker).execute(args);
      break;

    case 'reflect':
      deprecated('reflect', 'govern reflect');
      await new ReflectCommand(fileSystem, rootPath, taskRepository).execute(args);
      break;

    case 'report':
      deprecated('report', 'govern report');
      await new ReportCommand(fileSystem, gitRepository).execute();
      break;

    case 'ask':
      deprecated('ask', 'memory ask');
      await new AskCommand(new AskCorpus(fileSystem, rootPath, new CausalGraph(fileSystem, rootPath)), {
        getArgs: () => args,
        log: (s) => console.log(s),
        error: (s) => console.error(s),
        exit: (code) => process.exit(code) as never,
      }).execute();
      break;

    case 'causal': {
      deprecated('causal', 'memory causal');
      const causalGraph = new CausalGraph(fileSystem, rootPath);
      await new CausalCommand(causalGraph, {
        getArgs: () => args,
        log: (s) => console.log(s),
        error: (s) => console.error(s),
        exit: (code) => process.exit(code) as never,
      }, causalSignalLog).execute();
      break;
    }

    case 'index':
      deprecated('index', 'memory index');
      await new IndexCommand(fileSystem, gitRepository).execute();
      break;

    case 'explain': {
      deprecated('explain', 'memory explain');
      const { ExplainCommand } = await import('./application/commands/explain-command.js');
      await new ExplainCommand(taskRepository, fileSystem, causalSignalLog, rootPath).execute(args);
      break;
    }

    case 'deps': {
      deprecated('deps', 'memory deps');
      const { DepsCommand } = await import('./application/commands/deps-command.js');
      await new DepsCommand(taskRepository).execute(args);
      break;
    }

    case 'approve': {
      deprecated('approve', 'govern approve');
      const approveTaskId = args[0];
      if (!approveTaskId || !/^TASK-\d+$/.test(approveTaskId)) {
        console.error('Usage: arch govern approve TASK-XXX');
        process.exit(1);
      }
      const { EscalationStore } = await import('./application/use-cases/escalation-store.js');
      const approveStore = new EscalationStore(fileSystem, rootPath);
      await approveStore.append('APPROVED', approveTaskId, `Human approval granted via arch govern approve.`);
      console.log(`  ✔ Approved ${approveTaskId}. Run arch task loop --resume to continue.`);
      break;
    }

    default:
      console.log('Usage: arch [review|status|task|govern|memory|init|version]');
      console.log('');
      console.log('Core:');
      console.log('  arch review                    — structural validation and integrity audit');
      console.log('  arch status                    — high-level sprint and task progress');
      console.log('');
      console.log('Task Lifecycle:');
      console.log('  arch task start [TASK-XXX]     — start a task (interactive if ID omitted)');
      console.log('  arch task review TASK-XXX      — run predicates and move to REVIEW');
      console.log('  arch task done TASK-XXX        — archive completed task (launches Hansei wizard)');
      console.log('  arch task create "<intent>"    — scaffold new task from intent');
      console.log('  arch task capture "<intent>"   — capture, scaffold, and start in one step');
      console.log('');
      console.log('Governance & Analysis:');
      console.log('  arch govern                    — run governance tick (archive DONE, assign focus)');
      console.log('  arch govern inbox              — show urgent actions and refinement queue');
      console.log('  arch govern reflect            — trigger THINK mode for pattern analysis');
      console.log('  arch govern serve              — launch local visual dashboard (localhost:3000)');
      console.log('');
      console.log('Memory & Knowledge:');
      console.log('  arch memory ask "<query>"      — query the causal graph and task archive');
      console.log('  arch memory causal show <id>   — show causal edges for a task/ADR');
      console.log('');
      console.log('System:');
      console.log('  arch init                      — initialize ARCH in current repository');
      console.log('  arch version                   — show CLI version');
      process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
