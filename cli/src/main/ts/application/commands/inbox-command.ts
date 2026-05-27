import { Command } from '../../domain/models/command.js';
import { GenerateInbox, InboxData, DecisionItem } from '../use-cases/generate-inbox.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../use-cases/drift-checker.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { PathResolver } from '../../domain/services/path-resolver.js';

export class InboxCommand implements Command {
  private useCase: GenerateInbox;

  constructor(
    taskRepository: TaskRepository,
    fileSystem: FileSystem,
    reviewer: Reviewer,
    driftChecker: DriftChecker,
  ) {
    this.useCase = new GenerateInbox(taskRepository, fileSystem, reviewer, driftChecker);
  }

  async execute(args: string[] = []): Promise<number> {
    try {
      if (args.includes('--decisions')) {
        const items = await this.useCase.getDecisionQueue();
        this.renderDecisions(items);
        return 0;
      }
      if (args.includes('--resurrect')) {
        const items = await this.useCase.getResurrectQueue();
        this.renderResurrect(items);
        return 0;
      }
      const data = await this.useCase.execute();
      this.render(data);
    } catch (error: any) {
      fmt.warn(error.message);
    }
    return 0;
  }

  private renderResurrect(items: DecisionItem[]): void {
    fmt.header('Resurrection Queue');
    if (items.length === 0) {
      fmt.log('\n  No TTL-rejected or DEFERRED IDEAs in archive.\n');
      return;
    }
    fmt.log(`\n  ${items.length} IDEA(s) eligible for resurrection (oldest first):\n`);
    for (const item of items) {
      fmt.log(`  [${item.created}] ${item.sessions}s  ${item.slug}`);
      fmt.log(`    Title:   ${item.title}`);
      fmt.log(`    Problem: ${item.problem}`);
      const pr = PathResolver.from({});
      fmt.log(`    Resurrect: move from ${pr.refinementArchive}/ to ${pr.refinement}/, clear Decision, reset Status to DRAFT`);
      fmt.log('');
    }
  }

  private renderDecisions(items: DecisionItem[]): void {
    fmt.header('Decisions Required');
    if (items.length === 0) {
      fmt.log('\n  No IDEAs pending decision.\n');
      return;
    }
    fmt.log(`\n  ${items.length} IDEA(s) awaiting your decision:\n`);
    for (const item of items) {
      const marker = item.decisionRequired ? ' ⚠' : '';
      fmt.log(`  [${item.sessions} sessions]${marker} ${item.slug}`);
      fmt.log(`    Title:   ${item.title}`);
      fmt.log(`    Problem: ${item.problem}`);
      fmt.log(`    Created: ${item.created}`);
      fmt.log(`    Write in Decision field: PROMOTE → TASK-XXX | REJECT: <reason> | DEFERRED: <reason>`);
      fmt.log('');
    }
  }

  private render(data: InboxData): void {
    fmt.header('Interactive Inbox');

    fmt.log(`\n  Summary:`);
    fmt.log(`    - Active: ${data.summary.active}`);
    fmt.log(`    - Review: ${data.summary.review}`);
    fmt.log(`    - Ready:  ${data.summary.ready}`);

    fmt.log(`\n  Urgent / Actions Required:`);
    if (data.urgent.length > 0) {
      data.urgent.forEach(item => fmt.warn(item));
    } else {
      fmt.log(`    _No urgent items._`);
    }

    const awaitingPromotion = data.escalations.filter(e => e.type === 'AWAITING_PROMOTION');
    if (awaitingPromotion.length > 0) {
      fmt.log(`\n  Escalations (Awaiting Human Decision):`);
      awaitingPromotion.forEach(e => {
        fmt.log(`    - [${e.escalation_id}] AWAITING_PROMOTION ${e.subject}: ${e.reason}`);
      });
    }

    if (data.sprint) {
      fmt.log(`\n  Sprint: ${data.sprint.name} (${data.sprint.progress})`);
      if (data.sprint.openTasks.length > 0) {
        data.sprint.openTasks.forEach(t => {
          const focus = t.focus ? ' [FOCUS]' : '';
          fmt.log(`    - [${t.id}] ${t.title}${focus}`);
        });
      }
    }

    fmt.log(`\n  Refinement Queue:`);
    if (data.refinement.length > 0) {
      data.refinement.forEach(idea => fmt.log(`    - ${idea}`));
    } else {
      fmt.log(`    _No pending ideas._`);
    }

    fmt.log(`\n  Commands:`);
    fmt.log(`    arch task approve <task-id>  - Move REVIEW/IDEA to DONE/READY`);
    fmt.log(`    arch task redirect <task-id> --to "<msg>" - Move REVIEW to IN_PROGRESS`);
    fmt.log('');
  }
}
