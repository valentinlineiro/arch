import type { FileSystem } from '../repositories/file-system.js';
import type { Sprint, SprintStatus, SprintTransitionEvent } from '../models/sprint.js';
import { PathResolver } from './path-resolver.js';

const LEDGER_PATH = PathResolver.from({}).focusLedger;
const SPRINT_STATE_PATH = `${PathResolver.from({}).archDir}/sprint-state.json`;

export class SprintService {
  constructor(private fileSystem: FileSystem) {}

  // ── Read ──────────────────────────────────────────────────────────────────

  async getCurrent(): Promise<Sprint | null> {
    try {
      const raw = await this.fileSystem.readFile(SPRINT_STATE_PATH);
      return JSON.parse(raw) as Sprint;
    } catch { return null; }
  }

  async getStatus(): Promise<SprintStatus | null> {
    const sprint = await this.getCurrent();
    return sprint?.status ?? null;
  }

  // ── Transitions ───────────────────────────────────────────────────────────

  /**
   * Open a new sprint. Idempotent — if a sprint with this name is already
   * ACTIVE, returns it unchanged.
   */
  async openNext(name: string, target?: string): Promise<Sprint> {
    const current = await this.getCurrent();

    // Idempotency: already active with this name
    if (current && current.name === name && current.status === 'ACTIVE') {
      return current;
    }

    // Idempotency: NEXT_PENDING with this name → promote to ACTIVE
    if (current && current.name === name && current.status === 'NEXT_PENDING') {
      const activated: Sprint = { ...current, status: 'ACTIVE' };
      await this.persist(activated);
      await this.appendLedger({ type: 'SPRINT_OPEN', sprintName: name, timestamp: new Date().toISOString() });
      return activated;
    }

    const sprint: Sprint = {
      name,
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      target,
    };

    await this.persist(sprint);
    await this.appendLedger({ type: 'SPRINT_OPEN', sprintName: name, timestamp: sprint.startedAt });
    return sprint;
  }

  /**
   * Close the current sprint. Idempotent — if already CLOSED, returns it.
   */
  async closeCurrent(velocity?: number): Promise<Sprint> {
    const current = await this.getCurrent();
    if (!current) throw new Error('No active sprint to close');

    // Idempotency
    if (current.status === 'CLOSED') return current;

    const closed: Sprint = {
      ...current,
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      velocity,
    };

    await this.persist(closed);
    await this.appendLedger({
      type: 'SPRINT_CLOSE',
      sprintName: closed.name,
      timestamp: closed.closedAt!,
      velocity,
    });

    return closed;
  }

  /**
   * Stage the next sprint name without activating it.
   * Becomes ACTIVE on the first task archive after closeCurrent().
   */
  async stageNext(name: string, target?: string): Promise<Sprint> {
    const staged: Sprint = {
      name,
      status: 'NEXT_PENDING',
      startedAt: new Date().toISOString(),
      target,
    };
    await this.persist(staged);
    await this.appendLedger({ type: 'SPRINT_NEXT_PENDING', sprintName: name, timestamp: staged.startedAt });
    return staged;
  }

  // ── Config sync ───────────────────────────────────────────────────────────

  /**
   * Sync sprint name from arch.config.json on init.
   * If no sprint-state.json exists, seeds from config.
   */
  static async initFromConfig(
    fileSystem: FileSystem,
    configSprintName: string,
  ): Promise<Sprint> {
    const service = new SprintService(fileSystem);
    const existing = await service.getCurrent();

    if (existing && existing.name === configSprintName) return existing;

    // Config says a sprint exists but state file is missing — seed it
    return service.openNext(configSprintName);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async persist(sprint: Sprint): Promise<void> {
    await this.fileSystem.writeFile(SPRINT_STATE_PATH, JSON.stringify(sprint, null, 2));
  }

  private async appendLedger(event: SprintTransitionEvent): Promise<void> {
    try {
      let existing = '';
      try { existing = await this.fileSystem.readFile(LEDGER_PATH); } catch {}
      const line = JSON.stringify({
        ruling: event.type,
        taskId: event.sprintName,
        tick: Date.now(),
        timestamp: event.timestamp,
        velocity: event.velocity,
      });
      await this.fileSystem.writeFile(LEDGER_PATH, existing + (existing ? '\n' : '') + line);
    } catch { /* non-fatal */ }
  }
}
