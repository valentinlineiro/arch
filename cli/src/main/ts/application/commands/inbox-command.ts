import { GenerateInbox, InboxData, DecisionItem } from '../use-cases/generate-inbox.js';
import type { TaskRepository } from '../../domain/repositories/task-repository.js';
import type { Reviewer } from '../../domain/services/reviewer.js';
import type { DriftChecker } from '../use-cases/drift-checker.js';
import type { FileSystem } from '../../domain/repositories/file-system.js';
import * as fmt from '../../infrastructure/cli/output-formatter.js';

export class InboxCommand {
  private useCase: GenerateInbox;

  constructor(
    taskRepository: TaskRepository,
    fileSystem: FileSystem,
    reviewer: Reviewer,
    driftChecker: DriftChecker,
  ) {
    this.useCase = new GenerateInbox(taskRepository, fileSystem, reviewer, driftChecker);
  }

  async execute(args: string[] = []): Promise<void> {
    try {
      if (args.includes('--decisions')) {
        const items = await this.useCase.getDecisionQueue();
        this.renderDecisions(items);
        return;
      }
      if (args.includes('--resurrect')) {
        const items = await this.useCase.getResurrectQueue();
        this.renderResurrect(items);
        return;
      }
      const data = await this.useCase.execute();
      this.render(data);
    } catch (error: any) {
      fmt.warn(error.message);
    }
  }

  private renderResurrect(items: DecisionItem[]): void {
    fmt.header('Resurrection Queue');
    if (items.length === 0) {
      console.log('\n  No TTL-rejected or DEFERRED IDEAs in archive.\n');
      return;
    }
    console.log(`\n  ${items.length} IDEA(s) eligible for resurrection (oldest first):\n`);
    for (const item of items) {
      console.log(`  [${item.created}] ${item.sessions}s  ${item.slug}`);
      console.log(`    Title:   ${item.title}`);
      console.log(`    Problem: ${item.problem}`);
      console.log(`    Resurrect: move from docs/refinement/archive/ to docs/refinement/, clear Decision, reset Status to DRAFT`);
      console.log('');
    }
  }

  private renderDecisions(items: DecisionItem[]): void {
    fmt.header('Decisions Required');
    if (items.length === 0) {
      console.log('\n  No IDEAs pending decision.\n');
      return;
    }
    console.log(`\n  ${items.length} IDEA(s) awaiting your decision:\n`);
    for (const item of items) {
      const marker = item.decisionRequired ? ' ⚠' : '';
      console.log(`  [${item.sessions} sessions]${marker} ${item.slug}`);
      console.log(`    Title:   ${item.title}`);
      console.log(`    Problem: ${item.problem}`);
      console.log(`    Created: ${item.created}`);
      console.log(`    Write in Decision field: PROMOTE → TASK-XXX | REJECT: <reason> | DEFERRED: <reason>`);
      console.log('');
    }
  }

  private render(data: InboxData): void {
    fmt.header('Interactive Inbox');

    console.log(`\n  Summary:`);
    console.log(`    - Active: ${data.summary.active}`);
    console.log(`    - Review: ${data.summary.review}`);
    console.log(`    - Ready:  ${data.summary.ready}`);

    console.log(`\n  Urgent / Actions Required:`);
    if (data.urgent.length > 0) {
      data.urgent.forEach(item => fmt.warn(item));
    } else {
      console.log(`    _No urgent items._`);
    }

    const awaitingPromotion = data.escalations.filter(e => e.type === 'AWAITING_PROMOTION');
    if (awaitingPromotion.length > 0) {
      console.log(`\n  Escalations (Awaiting Human Decision):`);
      awaitingPromotion.forEach(e => {
        console.log(`    - [${e.escalation_id}] AWAITING_PROMOTION ${e.subject}: ${e.reason}`);
      });
    }

    if (data.sprint) {
      console.log(`\n  Sprint: ${data.sprint.name} (${data.sprint.progress})`);
      if (data.sprint.openTasks.length > 0) {
        data.sprint.openTasks.forEach(t => {
          const focus = t.focus ? ' [FOCUS]' : '';
          console.log(`    - [${t.id}] ${t.title}${focus}`);
        });
      }
    }

    console.log(`\n  Refinement Queue:`);
    if (data.refinement.length > 0) {
      data.refinement.forEach(idea => console.log(`    - ${idea}`));
    } else {
      console.log(`    _No pending ideas._`);
    }

    console.log(`\n  Commands:`);
    console.log(`    arch task approve <task-id>  - Move REVIEW/IDEA to DONE/READY`);
    console.log(`    arch task redirect <task-id> --to "<msg>" - Move REVIEW to IN_PROGRESS`);
    console.log('');
  }
}
