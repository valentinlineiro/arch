import * as fs from 'node:fs/promises';
import { FileSystem } from '../../domain/repositories/file-system.js';
import { NormalizeRepoEvents, type RawInputTrace } from '../use-cases/normalize-repo-events.js';
import { TransientWindowCompiler } from '../../domain/services/transient-window-compiler.js';
import { StatelessHypothesisGenerator } from '../../domain/services/stateless-hypothesis-generator.js';
import { TransientActuationProjector } from '../../domain/services/transient-actuation-projector.js';

export class CompileCommand {
  constructor(private fileSystem: FileSystem) {}

  async execute(args: string[]): Promise<void> {
    const inputIdx = args.indexOf('--input');
    const inputPath = inputIdx !== -1 && inputIdx + 1 < args.length ? args[inputIdx + 1] : args[0];

    if (!inputPath) {
      console.error('Error: Please provide a raw input telemetry JSON trace path.');
      console.error('Usage: arch compile <path-to-trace.json> [--seed <optional-seed>]');
      process.exit(1);
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

      console.log(`[ARCH Compile] Initiating stream transformation pipeline...`);
      console.log(`[ARCH Compile] Execution Seed: "${seed}" (strictly non-persistent)`);

      // 1. PHASE 1: Normalize
      const normalizedEvents = NormalizeRepoEvents.normalize(rawTraces);
      console.log(`[ARCH Compile] Phase 1: Syntactic normalizer completed. Compiled ${normalizedEvents.length} ordered time-blind events.`);

      // 2. PHASE 2: Partition & Windowing
      const config = {
        seed,
        baseWindowSize: 10,
        variationDelta: 3,
      };
      const windows = TransientWindowCompiler.partition(normalizedEvents, config);
      console.log(`[ARCH Compile] Phase 2: Transient Windowing Engine produced ${windows.length} isolated window frames.`);

      // 3. PHASE 2: Hypothesis Generation
      const windowOutputs = windows.map((window, idx) =>
        StatelessHypothesisGenerator.generate(window, idx, seed)
      );

      // 4. PHASE 3: Project
      const signal = TransientActuationProjector.project(windowOutputs);
      console.log(`[ARCH Compile] Phase 3: Actuation Projector compiled transient operational signals.`);

      console.log('\n--- OBSERVATIONAL TELEMETRY DIGEST ---');
      if (signal.observations.length === 0) {
        console.log('(No window observations available)');
      } else {
        for (const obs of signal.observations) {
          console.log(` • ${obs}`);
        }
      }

      console.log('\n--- ACTIVE OPERATIONAL ALERTS ---');
      if (signal.alerts.length === 0) {
        console.log(' ✔ No alerts triggered in current execution window.');
      } else {
        for (const alert of signal.alerts) {
          const prefix = alert.severity === 'WARN' ? ' ⚠ [WARN]' : ' ℹ [INFO]';
          console.log(`${prefix} ${alert.message}`);
        }
      }
      console.log('\n[ARCH Compile] Execution scope successfully dissolved. Sandboxed memory purged.');
    } catch (err: any) {
      console.error(`Error: Compilation pipeline collapsed: ${err.message}`);
      process.exit(1);
    }
  }
}
