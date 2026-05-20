import { CreateTask } from '../use-cases/create-task.js';
import { EditTaskMetadata } from '../use-cases/edit-task-metadata.js';
import { LoadBearingMemory } from '../use-cases/load-bearing-memory.js';
import { MarkTaskInProgress } from '../use-cases/mark-task-in-progress.js';
import { MarkTaskDone } from '../use-cases/mark-task-done.js';
import { MarkTaskReview } from '../use-cases/mark-task-review.js';
import { RejectTask } from '../use-cases/task-reject.js';
import { RejectStaleTask } from '../use-cases/task-reject-stale.js';
import { UpdateTaskMetrics } from '../use-cases/update-task-metrics.js';
import { ContextInference } from '../use-cases/context-inference.js';
import { ConstraintPreflight } from '../use-cases/constraint-preflight.js';
import { SemanticCollisionDetector } from '../use-cases/semantic-collision-detector.js';
import { CorrectionSignalStore, HANSEI_CATEGORIES, HANSEI_CATEGORY_ALIASES } from '../use-cases/correction-signal-store.js';
import { CompressTask } from '../use-cases/compress-task.js';
import { NextCommand } from './next-command.js';
import { RankCommand } from './rank-command.js';
import { PromoteCommand } from './promote-command.js';
import { HumanCoordinationService } from '../../domain/services/human-coordination-service.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import { Reviewer } from '../../domain/services/reviewer.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import type { GitRepository } from '../../domain/repositories/git-repository.js';
import { EventRepository } from '../../domain/models/event.js';
import { NodeFeedbackRepository } from '../../infrastructure/filesystem/node-feedback-repository.js';
import { CausalSignalLog } from '../use-cases/causal-signal-log.js';
import { EventLogger } from '../../domain/services/event-logger.js';
import { LightweightMetricsRefresh } from '../use-cases/lightweight-metrics-refresh.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { getPublicSubCommands } from '../../domain/services/command-registry.js';

export class TaskCommand {
  private markInProgress: MarkTaskInProgress;
  private markDone: MarkTaskDone;
  private markReview: MarkTaskReview;
  private rejectTask: RejectTask;
  private rejectStaleTask: RejectStaleTask;
  private updateMetrics: UpdateTaskMetrics;
  private taskRepository: TaskRepository;
  private gitRepository: GitRepository;
  private muriConfig: any;
  private rootPath: string;

  constructor(
    taskRepository: TaskRepository,
    reviewer: Reviewer,
    private humanCoordinationService: HumanCoordinationService,
    private fileSystem: FileSystem,
    rootPath: string,
    eventRepository?: EventRepository,
    causalSignalLog?: CausalSignalLog,
    gitRepository?: GitRepository,
    muriConfig?: any,
    eventLogger?: EventLogger
  ) {
    this.taskRepository = taskRepository;
    this.gitRepository = gitRepository!;
    this.muriConfig = muriConfig;
    this.rootPath = rootPath;
    this.markInProgress = new MarkTaskInProgress(taskRepository, eventRepository, gitRepository);
    this.markDone = new MarkTaskDone(taskRepository, reviewer, fileSystem, eventRepository, new NodeFeedbackRepository(fileSystem), causalSignalLog, eventLogger, gitRepository);
    this.markReview = new MarkTaskReview(taskRepository, rootPath);
    this.rejectTask = new RejectTask(taskRepository, eventLogger);
    this.rejectStaleTask = new RejectStaleTask(taskRepository);
    this.updateMetrics = new UpdateTaskMetrics(taskRepository);
  }

  async execute(args: string[]): Promise<void> {
    const subCommand = args[0];
    let taskId = args.find(arg => arg.startsWith('TASK-'));
    const force = args.includes('--force');
    const reasonIdx = args.indexOf('--reason');
    const reason = reasonIdx !== -1 ? args[reasonIdx + 1] : '';

    if (subCommand === 'start') {
      if (!taskId && process.stdout.isTTY) {
        const readyTasks = (await this.taskRepository.getAll()).filter(t => t.status === 'READY');
        if (readyTasks.length === 0) {
          fmt.fail('No READY tasks found.');
          process.exit(1);
        }
        fmt.header('Select a task to start:');
        readyTasks.forEach((t, i) => {
          console.log(`  ${i + 1}. [${t.id}] ${t.title}`);
        });
        const { createInterface } = await import('node:readline/promises');
        const rl = createInterface({ input: process.stdin, output: process.stdout });
        const answer = await rl.question('\n  Pick a number (1-' + readyTasks.length + ') or press Enter to cancel: ');
        rl.close();
        const idx = parseInt(answer.trim(), 10) - 1;
        if (readyTasks[idx]) {
          taskId = readyTasks[idx].id;
        } else {
          fmt.info('Cancelled.');
          process.exit(0);
        }
      }

      if (!taskId) {
        fmt.fail('Usage: arch task start TASK-XXX');
        process.exit(1);
      }

      try {
        const task = await this.markInProgress.execute(taskId, 'cli');
        fmt.arrow(`marking ${taskId} as IN_PROGRESS`);

        try {
          const taskText = `${task.title} ${task.content}`;
          const inference = new ContextInference(this.fileSystem);
          await inference.execute(taskId, taskText, task.class ?? '');
        } catch { /* inference errors must never block task start */ }

        try {
          const preflight = new ConstraintPreflight(this.fileSystem);
          const block = await preflight.execute(task.context ?? []);
          if (block) console.log(block);
        } catch { /* preflight errors must never block task start */ }

        try {
          const memory = new LoadBearingMemory(this.taskRepository, this.fileSystem);
          const block = await memory.execute(task);
          if (block) console.log(block);
        } catch { /* memory injection errors must never block task start */ }

        try {
          const taskPath = `docs/tasks/${taskId}.md`;
          const taskContent = await this.fileSystem.readFile(taskPath);
          const detector = new SemanticCollisionDetector(this.fileSystem);
          const advisory = await detector.execute(taskContent, taskId);
          if (advisory) console.log(advisory);
        } catch { /* collision detection errors must never block task start */ }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'create') {
      const classIdx = args.indexOf('--class');
      let taskClass: string | undefined;
      const filteredArgs = [...args];
      if (classIdx !== -1) {
        taskClass = filteredArgs[classIdx + 1];
        filteredArgs.splice(classIdx, 2);
      }

      const intent = filteredArgs.slice(1).join(' ').replace(/^["']|["']$/g, '');
      if (!intent) {
        fmt.fail('Usage: arch task create "<intent>" [--class <class>]');
        process.exit(1);
      }
      try {
        fmt.arrow('scaffolding task from intent...');
        const creator = new CreateTask(this.taskRepository, this.fileSystem, this.gitRepository);
        const newId = await creator.execute(intent, taskClass);
        fmt.check(`created ${newId}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'edit' && taskId) {
      try {
        const editor = new EditTaskMetadata(this.taskRepository, this.gitRepository);
        await editor.execute(taskId);
        fmt.check(`metadata updated for ${taskId}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'metrics' && taskId) {
      const costIdx = args.indexOf('--cost');
      const stepsIdx = args.indexOf('--steps');
      const addCostIdx = args.indexOf('--add-cost');
      const addStepsIdx = args.indexOf('--add-steps');

      const options: any = {};
      if (costIdx !== -1) options.cost = parseFloat(args[costIdx + 1]);
      if (stepsIdx !== -1) options.steps = parseInt(args[stepsIdx + 1], 10);
      if (addCostIdx !== -1) options.addCost = parseFloat(args[addCostIdx + 1]);
      if (addStepsIdx !== -1) options.addSteps = parseInt(args[addStepsIdx + 1], 10);

      try {
        await this.updateMetrics.execute(taskId, options);
        fmt.arrow(`updated metrics for ${taskId}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'review' && taskId) {
      try {
        const result = await this.markReview.execute(taskId);
        if (result.passed) {
          fmt.check(`${taskId} predicates passed — status set to REVIEW`);
        } else {
          fmt.fail(`${taskId} has failing cmd: predicates:`);
          result.failures.forEach(f => console.log(`    - ${f}`));
          process.exit(1);
        }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'done' && args.includes('--redirect') && taskId) {
      try {
        const correctionIdx = args.indexOf('--correction');
        const correctionArg = correctionIdx >= 0 ? args[correctionIdx + 1] : undefined;

        let category = '';
        let summary = '';

        if (correctionArg) {
          const colonIdx = correctionArg.indexOf(':');
          if (colonIdx > 0) {
            category = correctionArg.slice(0, colonIdx).trim();
            summary = correctionArg.slice(colonIdx + 1).trim();
          } else {
            summary = correctionArg;
          }
        }

        if (!category || !summary) {
          console.log(`\n  Capture correction signal for ${taskId}`);
          console.log(`  Categories: ${HANSEI_CATEGORIES.join(', ')}`);
          console.log(`  Aliases: ${Object.entries(HANSEI_CATEGORY_ALIASES).map(([k,v]) => `${k}=${v}`).join(', ')}`);
          if (!category) {
            const { createInterface } = await import('node:readline/promises');
            const rl = createInterface({ input: process.stdin, output: process.stdout });
            const rawCat = await rl.question('  Category (or alias): ');
            const resolved = CorrectionSignalStore.resolveCategory(rawCat.trim());
            if (!resolved) { rl.close(); throw new Error(`Unknown category: ${rawCat.trim()}`); }
            category = resolved;
            if (!summary) {
              summary = await rl.question('  Summary (one line): ');
            }
            rl.close();
          }
        } else {
          const resolved = CorrectionSignalStore.resolveCategory(category);
          if (!resolved) throw new Error(`Unknown category: ${category}`);
          category = resolved;
        }

        const taskPath = `${this.rootPath}/docs/tasks/${taskId}.md`;
        let taskContent = '';
        try { taskContent = await this.fileSystem.readFile(taskPath); } catch { /* archive path */ }

        const store = new CorrectionSignalStore(this.fileSystem, this.rootPath);
        const signal = await store.append({
          source_type: 'redirect',
          task_ref: taskId,
          file_refs: CorrectionSignalStore.extractFileRefs(taskContent),
          adr_refs: CorrectionSignalStore.extractAdrRefs(taskContent),
          category,
          correction_kind: 'scope',
          summary,
          authority: 'low',
        });
        fmt.check(`correction signal logged: ${signal.signal_id} [${category}]`);
      } catch (error: any) {
        fmt.fail(`Correction signal: ${error.message}`);
      }
    } else if (subCommand === 'done' && taskId) {
      if (!force) {
        const taskFile = `${this.rootPath}/docs/tasks/${taskId}.md`;
        try {
          const content = await this.fileSystem.readFile(taskFile);
          if (/^[[:space:]]*- \[ \]/m.test(content) || content.includes('- [ ]')) {
            fmt.fail(`Task ${taskId} has unchecked Acceptance Criteria.`);
            console.error(`    Please check all ACs or use --force to override.`);
            process.exit(1);
          }
        } catch { /* file not found — let markDone handle it */ }
      }
      try {
        await this.markDone.execute(taskId, force);
        fmt.check(`marking ${taskId} as DONE`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'reject' && taskId) {
      try {
        await this.rejectTask.execute(taskId, reason);
        fmt.arrow(`rejected ${taskId} — moved back to READY`);
        if (reason) console.log(`    Reason: ${reason}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'reject-stale' && taskId) {
      try {
        await this.rejectStaleTask.execute(taskId);
        fmt.arrow(`rejected ${taskId} — archived as stale`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'approve' && taskId) {
      try {
        await this.humanCoordinationService.approveTask(taskId);
        fmt.check(`approved ${taskId}`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'redirect' && taskId) {
      try {
        const toIdx = args.indexOf('--to');
        const instruction = toIdx !== -1 ? args.slice(toIdx + 1).join(' ') : '';
        if (!instruction) throw new Error('Missing instruction after --to');
        
        await this.humanCoordinationService.redirectTask(taskId, instruction);
        fmt.check(`redirected ${taskId} with new instruction`);
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
    } else if (subCommand === 'reprioritize') {
      const { ReprioritizeCommand } = await import('./reprioritize-command.js');
      await new ReprioritizeCommand(this.taskRepository, this.fileSystem, this.rootPath).execute(args.slice(1));
    } else if (subCommand === 'next') {
      await new NextCommand(this.taskRepository, args.slice(1), this.muriConfig, this.fileSystem, this.rootPath).execute();
    } else if (subCommand === 'rank') {
      await new RankCommand(this.taskRepository).execute();
    } else if (subCommand === 'promote') {
      await new PromoteCommand(this.taskRepository, this.gitRepository, this.fileSystem).execute(args.slice(1));
    } else if (subCommand === 'compress') {
      const compressor = new CompressTask(this.fileSystem, process.cwd());
      const all = args.includes('--all');
      try {
        if (all) {
          const ids = await compressor.executeAll();
          fmt.check(`compressed ${ids.length} archive files`);
        } else if (taskId) {
          await compressor.execute(taskId);
          fmt.check(`compressed ${taskId}`);
        } else {
          fmt.fail('Usage: arch task compress TASK-XXX | arch task compress --all');
          process.exit(1);
        }
      } catch (error: any) {
        fmt.fail(error.message);
        process.exit(1);
      }
} else if (subCommand === '--help' || subCommand === 'help' || !subCommand) {
      const entries = getPublicSubCommands('task');
      const lines: string[] = [
        'Usage: arch task <subcommand> [args]',
        '',
        'Subcommands:',
      ];
      for (const e of entries) {
        const sub = e.subCommand!;
        const label = sub.length <= 18 ? sub.padEnd(18) : sub;
        lines.push(`  ${label} — ${e.description}`);
      }
      console.log(lines.join('\n'));
    } else if (subCommand === 'new') {
      await this.executeNew(args.slice(1));
    } else if (subCommand === 'split' && taskId) {
      await this.executeSplit([taskId, ...args.slice(2)]);
    } else if (subCommand === 'split') {
      fmt.fail('Usage: arch task split TASK-XXX [--titles "A,B"]');
    } else {
      fmt.fail(`Unknown subcommand: ${subCommand}. Run 'arch task --help' for usage.`);
      process.exit(1);
    }
  }
  private async executeSplit(args: string[]): Promise<void> {
    const taskId = args[0];
    if (!taskId || !/^TASK-\d+$/.test(taskId)) {
      fmt.fail('Usage: arch task split TASK-XXX [--titles "Title A,Title B"]');
      process.exit(1);
    }

    const task = await this.taskRepository.getById(taskId);
    if (!task) { fmt.fail(`Task ${taskId} not found`); process.exit(1); }

    const validSizes = ['L', 'XL'];
    if (!validSizes.includes(task.size?.trim())) {
      fmt.fail(`arch task split only applies to L or XL tasks. ${taskId} is ${task.size}.`);
      process.exit(1);
    }

    // Parse titles
    const titlesArg = args.indexOf('--titles');
    let titles: string[] = [];

    if (titlesArg >= 0 && args[titlesArg + 1]) {
      titles = args[titlesArg + 1].split(',').map(t => t.trim()).filter(Boolean);
    } else if (process.stdout.isTTY) {
      const { createInterface } = await import('node:readline/promises');
      const { stdin, stdout } = await import('node:process');
      const rl = createInterface({ input: stdin, output: stdout });
      try {
        const countStr = await rl.question('  How many sub-tasks? (2-4): ');
        const count = Math.min(4, Math.max(2, parseInt(countStr.trim(), 10) || 2));
        for (let i = 0; i < count; i++) {
          const title = await rl.question(`  Sub-task ${i + 1} title: `);
          titles.push(title.trim() || `${task.title} (part ${i + 1})`);
        }
      } finally { rl.close(); }
    } else {
      fmt.fail('Non-TTY: provide --titles "Title A,Title B"');
      process.exit(1);
    }

    // Get next task ID
    const allTasks = await this.taskRepository.getAll();
    const maxId = allTasks.reduce((max, t) => {
      const n = parseInt(t.id.replace('TASK-', ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);

    const newIds: string[] = [];
    const contextStr = task.context?.join(',') || 'none';
    for (let i = 0; i < titles.length; i++) {
      const newId = `TASK-${String(maxId + 1 + i).padStart(3, '0')}`;
      newIds.push(newId);
      const newContent = [
        '## ' + newId + ': ' + titles[i],
        '**Meta:** ' + task.priority + ' | S | READY | Focus:no | ' + task.class + ' | ' + task.cli + ' | ' + contextStr,
        '**Spawned-from:** ' + taskId,
        '**Depends:** none',
        '',
        '### Context',
        'Decomposed from ' + taskId + ': ' + task.title,
        '',
        '### Acceptance Criteria',
        '- [ ] (fill in)',
        '',
        '## Hansei',
        '**Severity:** H0',
        '**Category:** [no-issue]',
        '**Decision:** Not yet started.',
        '**Constraint:** None.',
        '**Cost:** None.',
        '**Forward Action:** None.',
      ].join('\n');
      await this.fileSystem.writeFile(`docs/tasks/${newId}.md`, newContent);
      fmt.check(`Created ${newId}: ${titles[i]}`);
    }

    // Archive original as DONE with split Hansei
    const closedAt = new Date().toISOString();
    const splitHansei = [
      '',
      `**Closed-at:** ${closedAt}`,
      '',
      '## Approval',
      `Approved-by: arch-task-split | ${closedAt.slice(0, 10)}`,
      '',
      '## Hansei',
      '**Severity:** H0',
      '**Category:** [no-issue]',
      `**Decision:** Task decomposed into ${newIds.join(', ')} via arch task split.`,
      '**Constraint:** None — split was intentional.',
      '**Cost:** No debt introduced — sub-tasks inherit full context.',
      '**Forward Action:** None required.',
    ].join('\n');

    const updatedContent = task.content
      .replace(/\| (READY|IN_PROGRESS|REVIEW) \|/, '| DONE |')
      .replace(/Focus:yes/, 'Focus:no') + splitHansei;

    await this.fileSystem.writeFile(`docs/tasks/${taskId}.md`, updatedContent);
    fmt.info(`Archived ${taskId} as DONE (superseded by ${newIds.join(', ')})`);
  }


  private async executeNew(args: string[]): Promise<void> {
    const classArg = args.indexOf('--class');
    const sizeArg = args.indexOf('--size');
    const priorityArg = args.indexOf('--priority');
    const cliArg = args.indexOf('--cli');
    const contextArg = args.indexOf('--context');
    const titleArg = args.findIndex(a => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') === false);

    const taskClass = classArg >= 0 ? args[classArg + 1] : undefined;
    const size = sizeArg >= 0 ? args[sizeArg + 1] : 'S';
    const priority = priorityArg >= 0 ? args[priorityArg + 1] : 'P2';
    const cli = cliArg >= 0 ? args[cliArg + 1] : 'claude-code';
    const context = contextArg >= 0 ? args[contextArg + 1] : 'none';
    const title = args.filter(a => !a.startsWith('--') && args[Math.max(0, args.indexOf(a) - 1)]?.startsWith('--') !== true).pop();

    if (!taskClass || !title) {
      console.log('Usage: arch task new --class <class> --size <size> "Task title"');
      console.log('');
      console.log('Classes: 1-code-reasoning, 2-code-generation, 6-writing, 7-operations, ...');
      console.log('Sizes:   XS, S, M, L');
      process.exit(1);
    }

    // Get next task ID
    const allTasks = await this.taskRepository.getAll();
    const archiveDir = (this.rootPath ? this.rootPath + '/' : '') + 'docs/archive';
    let archiveFiles: string[] = [];
    try { archiveFiles = await this.fileSystem.readDirectory(archiveDir); } catch { /* no archive */ }
    const archiveNums = archiveFiles
      .filter(f => f.startsWith('TASK-') && f.endsWith('.md'))
      .map(f => parseInt(f.replace('TASK-', '').replace('.md', ''), 10))
      .filter(n => !isNaN(n));
    const maxId = Math.max(
      ...allTasks.map(t => parseInt(t.id.replace('TASK-', ''), 10)).filter(n => !isNaN(n)),
      ...archiveNums,
      0
    );
    const newId = 'TASK-' + String(maxId + 1).padStart(3, '0');

    // Load class template or fall back to generic
    const classPrefix = taskClass.split('-')[0];
    const templatePaths = [
      'docs/templates/task-' + taskClass + '.md',
      'docs/templates/task-' + classPrefix + '.md',
    ];
    let template = '';
    for (const tp of templatePaths) {
      try { template = await this.fileSystem.readFile(tp); break; } catch { /* try next */ }
    }
    if (!template) {
      template = [
        '## {{TASK_ID}}: {{TITLE}}',
        '**Meta:** {{PRIORITY}} | {{SIZE}} | READY | Focus:no | {{CLASS}} | {{CLI}} | {{CONTEXT}}',
        '',
        '**Depends:** none',
        '',
        '### Context',
        '',
        '{{CONTEXT_DESCRIPTION}}',
        '',
        '### Acceptance Criteria',
        '',
        '- [ ] (fill in)',
        '  - `prose: verified`',
        '',
        '## Hansei',
        '**Severity:** H0',
        '**Category:** [no-issue]',
        '**Decision:** Not yet started.',
        '**Constraint:** None.',
        '**Cost:** None.',
        '**Forward Action:** None.',
      ].join('\n');
    }

    const content = template
      .replace(/{{TASK_ID}}/g, newId)
      .replace(/{{TITLE}}/g, title)
      .replace(/{{PRIORITY}}/g, priority)
      .replace(/{{SIZE}}/g, size)
      .replace(/{{CLASS}}/g, taskClass)
      .replace(/{{CLI}}/g, cli)
      .replace(/{{CONTEXT}}/g, context)
      .replace(/{{CONTEXT_DESCRIPTION}}/g, '(describe context here)');

    await this.fileSystem.writeFile('docs/tasks/' + newId + '.md', content);
    fmt.check(newId + ' created: docs/tasks/' + newId + '.md');
  }


}
