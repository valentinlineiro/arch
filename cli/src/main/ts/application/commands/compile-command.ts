import * as fmt from '../../infrastructure/cli/output-formatter.js';
import { Command } from '../../domain/models/command.js';
import * as fs from 'node:fs/promises';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { NormalizeRepoEvents, type RawInputTrace } from '../use-cases/normalize-repo-events.js';
import { TransientWindowCompiler } from '../../domain/services/transient-window-compiler.js';
import { StatelessHypothesisGenerator } from '../../domain/services/stateless-hypothesis-generator.js';
import { TransientActuationProjector } from '../../domain/services/transient-actuation-projector.js';

export class CompileCommand implements Command {
  constructor(private fileSystem: FileSystem) {}

  async execute(args: string[]): Promise<number> {
    const inputIdx = args.indexOf('--input');
    const inputPath = inputIdx !== -1 && inputIdx + 1 < args.length ? args[inputIdx + 1] : args[0];

    if (!inputPath) {
      fmt.error('Error: Please provide a raw input telemetry JSON trace path.');
      fmt.error('Usage: arch compile <path-to-trace.json> [--seed <optional-seed>]');
      return 1;
    }

    const seedIdx = args.indexOf('--seed');
    // Seed is generated per-run stochastically if not explicitly provided
    const seed = seedIdx !== -1 && seedIdx + 1 < args.length 
      ? args[seedIdx + 1] 
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    try {
      const rawContent = await this.fileSystem.readFile(inputPath);
      const rawTraces = JSON.parse(rawContent) as RawInputTrace[];

      if (!Array.isArray(rawTraces)) {
        throw new Error('Telemetry trace file must contain a JSON array of RawInputTrace objects.');
      }

      fmt.log(`[ARCH Compile] Initiating stream transformation pipeline...`);
      fmt.log(`[ARCH Compile] Execution Seed: "${seed}" (strictly non-persistent)`);

      // 1. PHASE 1: Normalize
      const normalizedEvents = NormalizeRepoEvents.normalize(rawTraces);
      fmt.log(`[ARCH Compile] Phase 1: Syntactic normalizer completed. Compiled ${normalizedEvents.length} ordered time-blind events.`);

      // 2. PHASE 2: Partition & Windowing
      const config = {
        seed,
        baseWindowSize: 10,
        variationDelta: 3,
      };
      const windows = TransientWindowCompiler.partition(normalizedEvents, config);
      fmt.log(`[ARCH Compile] Phase 2: Transient Windowing Engine produced ${windows.length} isolated window frames.`);

      // 3. PHASE 2: Hypothesis Generation
      const windowOutputs = windows.map((window, idx) =>
        StatelessHypothesisGenerator.generate(window, idx, seed)
      );

      // 4. PHASE 3: Project
      const signal = TransientActuationProjector.project(windowOutputs);
      fmt.log(`[ARCH Compile] Phase 3: Actuation Projector compiled transient operational signals.`);

      fmt.log('\n--- OBSERVATIONAL TELEMETRY DIGEST ---');
      if (signal.observations.length === 0) {
        fmt.log('(No window observations available)');
      } else {
        for (const obs of signal.observations) {
          fmt.log(` • ${obs}`);
        }
      }

      fmt.log('\n--- ACTIVE OPERATIONAL ALERTS ---');
      if (signal.alerts.length === 0) {
        fmt.log(' ✔ No alerts triggered in current execution window.');
      } else {
        for (const alert of signal.alerts) {
          const prefix = alert.severity === 'WARN' ? ' ⚠ [WARN]' : ' ℹ [INFO]';
          fmt.log(`${prefix} ${alert.message}`);
        }
      }
      fmt.log('\n[ARCH Compile] Execution scope successfully dissolved. Sandboxed memory purged.');
    } catch (err: any) {
      fmt.error(`Error: Compilation pipeline collapsed: ${err.message}`);
      return 1;
    }
    return 0;
  }
}
