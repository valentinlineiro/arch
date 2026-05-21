
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { NodeFileSystem } from '../../infrastructure/filesystem/node-file-system.js';
import { StructuralExtractor } from '../../domain/services/structural-extractor.js';
import { SubsystemClusterer } from '../../domain/services/subsystem-clusterer.js';
import { BehavioralProfiler } from '../../domain/services/behavioral-profiler.js';
import { RoleInferenceEngine } from '../../domain/services/role-inference-engine.js';
import { RiskDetector } from '../../domain/services/risk-detector.js';
import { InstrumentationPlanner } from '../../domain/services/instrumentation-planner.js';
import { ARCHDeploymentMap, Subsystem, Risk, InstrumentationPlan } from '../../domain/models/deployment-map.js';

export class AuditCommand {
  async execute(args: string[]): Promise<void> {
    const target = args[0] ?? '.';
    const verbose = args.includes('--verbose') || args.includes('-v');

    let repoPath: string;
    let tmpDir: string | null = null;

    if (target.startsWith('https://') || target.startsWith('git@')) {
      console.log(`\n  Cloning ${target}...`);
      tmpDir = mkdtempSync(join(tmpdir(), 'arch-audit-'));
      try {
        execSync(`git clone --depth 1 "${target}" "${tmpDir}"`, { stdio: 'pipe' });
        repoPath = tmpDir;
        console.log(`  Cloned to ${tmpDir}\n`);
      } catch (e: any) {
        if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
        process.stderr.write(`  Failed to clone: ${e.message}\n`);
        process.exit(1);
      }
    } else {
      repoPath = resolve(target);
      if (!existsSync(repoPath)) {
        process.stderr.write(`  Path not found: ${repoPath}\n`);
        process.exit(1);
      }
    }

    try {
      await this.runAudit(repoPath, { verbose });
    } finally {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  private async runAudit(repoPath: string, opts: { verbose: boolean }): Promise<void> {
    const fs = new NodeFileSystem();
    console.log(`\n  \x1b[32mARCH\x1b[0m — Repository Audit (v1.0)\n`);
    console.log(`  Path: ${repoPath}\n`);

    // ── Step 1: Structural Extraction ─────────────────────────────────────
    process.stdout.write('  [1/6] Extracting structural metadata...');
    const extractor = new StructuralExtractor(fs, repoPath);
    const structural = await extractor.extract();
    process.stdout.write(` ${structural.files.length} files, ${structural.graph.edges.length} edges\n`);

    // ── Step 2: Subsystem Clustering ──────────────────────────────────────
    process.stdout.write('  [2/6] Clustering subsystem boundaries...');
    const clusterer = new SubsystemClusterer();
    let subsystems = clusterer.cluster(structural.files, structural.graph);
    process.stdout.write(` ${subsystems.length} clusters identified\n`);

    // ── Step 3: Behavioral Profiling ──────────────────────────────────────
    process.stdout.write('  [3/6] Computing behavioral profiles...');
    const profiler = new BehavioralProfiler(fs, repoPath);
    subsystems = await profiler.profile(subsystems);
    process.stdout.write(' done\n');

    // ── Step 4: Role Inference ───────────────────────────────────────────
    process.stdout.write('  [4/6] Inferring subsystem roles...');
    const inference = new RoleInferenceEngine();
    subsystems = inference.infer(subsystems);
    process.stdout.write(' done\n');

    // ── Step 5: Risk Detection ───────────────────────────────────────────
    process.stdout.write('  [5/6] Detecting structural risks...');
    const riskDetector = new RiskDetector();
    const risks = riskDetector.detect(subsystems, structural.graph);
    process.stdout.write(` ${risks.length} hotspots detected\n`);

    // ── Step 6: Instrumentation Mapping ──────────────────────────────────
    process.stdout.write('  [6/6] Mapping instrumentation points...');
    const planner = new InstrumentationPlanner();
    const plan = planner.plan(subsystems, risks, structural);
    process.stdout.write(` ${plan.recommendedHooks.length} hooks recommended\n\n`);

    const map: ARCHDeploymentMap = {
      repository: {
        languages: structural.languages,
        entrypoints: structural.entrypoints,
        buildSystem: structural.buildSystem,
      },
      subsystems,
      dependencyGraph: structural.graph,
      riskMap: risks,
      instrumentationPlan: plan,
    };

    this.render(map, opts.verbose);

    // Cache audit result
    try {
      const archDir = `${repoPath}/.arch`;
      if (!existsSync(archDir)) mkdirSync(archDir, { recursive: true });
      writeFileSync(`${archDir}/deployment-map.json`, JSON.stringify(map, null, 2));
    } catch { /* non-blocking */ }
  }

  private render(map: ARCHDeploymentMap, verbose: boolean): void {
    // 1. Repository Overview
    console.log(`  \x1b[1mREPOSITORY OVERVIEW\x1b[0m`);
    console.log(`    Languages:    ${map.repository.languages.join(', ')}`);
    console.log(`    Build System: ${map.repository.buildSystem.join(', ')}`);
    console.log(`    Entrypoints:  ${map.repository.entrypoints.join(', ') || 'none detected'}\n`);

    // 2. Subsystems
    console.log(`  \x1b[1mSUBSYSTEM DEPLOYMENT MAP (${map.subsystems.length})\x1b[0m`);
    const sortedSubsystems = [...map.subsystems].sort((a, b) => b.files.length - a.files.length);
    for (const s of sortedSubsystems.slice(0, 10)) {
      const p = s.behavioralProfile;
      console.log(`    \x1b[36m${s.id.padEnd(20)}\x1b[0m — ${s.inferredRole.label}`);
      if (verbose) {
        console.log(`      \x1b[90mSignals: ${s.inferredRole.basis.join(', ') || 'none'}\x1b[0m`);
        console.log(`      \x1b[90mProfile: IO:${p.ioIntensity} | Async:${p.asyncDensity} | Mutation:${p.stateMutationDensity} | Config:${p.configDependency}\x1b[0m`);
      }
    }
    if (map.subsystems.length > 10) console.log(`    ... and ${map.subsystems.length - 10} more subsystems.`);
    console.log('');

    // 3. Structural Risks
    if (map.riskMap.length > 0) {
      console.log(`  \x1b[31m\x1b[1mSTRUCTURAL RISKS (${map.riskMap.length})\x1b[0m`);
      for (const risk of map.riskMap) {
        const severityColor = risk.severity === 'HIGH' ? '\x1b[31m' : '\x1b[33m';
        console.log(`    ${severityColor}[${risk.type}]\x1b[0m ${risk.locations[0]}`);
        console.log(`    \x1b[90m→ ${risk.description}\x1b[0m`);
      }
      console.log('');
    }

    // 4. Instrumentation Plan
    console.log(`  \x1b[32m\x1b[1mARCH INSTRUMENTATION PLAN\x1b[0m`);
    console.log(`    High Priority:   ${map.instrumentationPlan.highPriority.length} zones`);
    console.log(`    Medium Priority: ${map.instrumentationPlan.mediumPriority.length} zones`);
    console.log(`    Low Priority:    ${map.instrumentationPlan.lowPriority.length} zones\n`);

    console.log(`    \x1b[1mRecommended Hooks (${map.instrumentationPlan.recommendedHooks.length}):\x1b[0m`);
    for (const hook of map.instrumentationPlan.recommendedHooks.slice(0, 8)) {
      console.log(`    \x1b[32m[${hook.type.padEnd(22)}]\x1b[0m ${hook.location}`);
      if (verbose) console.log(`      \x1b[90mReason: ${hook.reason}\x1b[0m`);
    }
    if (map.instrumentationPlan.recommendedHooks.length > 8) {
      console.log(`    ... and ${map.instrumentationPlan.recommendedHooks.length - 8} more recommendations.`);
    }
    console.log('');

    console.log(`  \x1b[90mNote: This map is generated from structural and behavioral signals. Labels are hypotheses, not truth claims.\x1b[0m\n`);
  }
}
