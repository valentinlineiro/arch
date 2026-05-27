import * as fmt from '../../infrastructure/cli/output-formatter.js';

import { Command } from '../../domain/models/command.js';
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { NodeFileSystem } from '../../infrastructure/filesystem/node-file-system.js';
import { TypeScriptAdapter } from '../../domain/services/typescript-adapter.js';
import { JavaAdapter } from '../../domain/services/java-adapter.js';
import { PythonAdapter } from '../../domain/services/python-adapter.js';
import { UEGIRBuilder } from '../../domain/services/ueg-ir-builder.js';
import { UEGAnalysisLayer } from '../../domain/services/ueg-analysis-layer.js';
import { ARCHDeploymentMap, UEGGraph, UEGGraphFragment } from '../../domain/models/ueg-ir.js';
import { LanguageAdapter } from '../../domain/services/ueg-interfaces.js';

export class AuditCommand implements Command {
  async execute(args: string[]): Promise<number> {
    const isPublic = args.includes('--public');
    const target = (isPublic ? args[args.indexOf('--public') + 1] : args[0]) ?? '.';
    const verbose = args.includes('--verbose') || args.includes('-v');

    let repoPath: string;
    let tmpDir: string | null = null;

    if (target.startsWith('https://') || target.startsWith('git@')) {
      fmt.log(`\n  Cloning ${target}...`);
      tmpDir = mkdtempSync(join(tmpdir(), 'arch-audit-'));
      try {
        execSync(`git clone --depth 1 "${target}" "${tmpDir}"`, { stdio: 'pipe' });
        repoPath = tmpDir;
      } catch (e: any) {
        if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
        process.stderr.write(`  Failed to clone: ${e.message}\n`);
        return 1;
      }
    } else {
      repoPath = resolve(target);
      if (!existsSync(repoPath)) {
        process.stderr.write(`  Path not found: ${repoPath}\n`);
        return 1;
      }
    }

    try {
      await this.runAudit(repoPath, { verbose, publicMode: isPublic });
    } finally {
      if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
    }
    return 0;
  }

  private async runAudit(repoPath: string, opts: { verbose: boolean; publicMode?: boolean }): Promise<void> {
    const modeLabel = opts.publicMode
      ? 'Structural MRI (public, non-authoritative)'
      : 'Language-Agnostic Audit (v1.2.0)';
    fmt.log(`\n  \x1b[32mARCH\x1b[0m — ${modeLabel}\n`);
    
    const adapters: LanguageAdapter[] = [
      new TypeScriptAdapter(),
      new JavaAdapter(),
      new PythonAdapter(),
    ];

    const fragments: UEGGraphFragment[] = [];
    const languageCoverage = new Set<string>();

    const files = this.listAllFiles(repoPath);
    fmt.log(`  [1/4] Extracting UEG fragments from ${files.length} files...`);

    for (const file of files) {
      const ext = extname(file).toLowerCase();
      const adapter = adapters.find(a => a.supportedExtensions.includes(ext));
      if (adapter) {
        try {
          const content = readFileSync(join(repoPath, file), 'utf8');
          const fragment = await adapter.parse(file, content);
          fragments.push(fragment);
          languageCoverage.add(adapter.language);
        } catch { /* skip */ }
      }
    }

    fmt.log(`  [2/4] Merging Unified Epistemic Graph IR...`);
    const builder = new UEGIRBuilder();
    const graph = builder.merge(fragments, Array.from(languageCoverage));

    fmt.log(`  [3/4] Running non-authoritative analysis layers...`);
    const analysis = new UEGAnalysisLayer();
    const subsystems = analysis.generateSubsystemViews(graph);
    const risks = analysis.detectRisks(graph);
    const instrumentation = analysis.planInstrumentation(graph, risks);

    const map: ARCHDeploymentMap = {
      graph,
      subsystems,
      risks,
      instrumentation,
    };

    fmt.log(`  [4/4] Generating structural deployment map...\n`);
    this.render(map, opts.verbose);

    // Public mode: add MRI summary line + canonical disclaimer
    if (opts.publicMode) {
      const hotspots = risks.filter(r => r.type === 'HIGH_COUPLING' || (r as any).type === 'GOD_ENTITY').length;
      const orphans = risks.filter(r => (r as any).type === 'ORPHAN' || (r as any).type === 'DEAD_CODE').length;
      const coupledPairs = graph.edges.filter((e: any) => e.weight > 3).length;
      const couplingPct = graph.entities.length > 0
        ? Math.round((coupledPairs / graph.entities.length) * 100)
        : 0;
      fmt.log(`  \x1b[1mMRI SUMMARY:\x1b[0m ${hotspots} hotspot${hotspots !== 1 ? 's' : ''}, ${orphans} orphan file${orphans !== 1 ? 's' : ''}, ${couplingPct}% hidden coupling`);
      fmt.log(`  \x1b[90m⚠ These are structural observations — not canonical truths.\x1b[0m`);
      fmt.log(`  \x1b[90m  ARCH v1.2 applies heuristic analysis. No claim is authoritative without domain context.\x1b[0m\n`);
    }

    // Cache audit result
    try {
      const archDir = `${repoPath}/.arch`;
      if (!existsSync(archDir)) mkdirSync(archDir, { recursive: true });
      writeFileSync(`${archDir}/deployment-map-v1.1.json`, JSON.stringify(map, null, 2));
    } catch { /* non-blocking */ }
  }

  private listAllFiles(dir: string, base: string = ''): string[] {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir);
    } catch (e: any) {
      if (e.code === 'EACCES') return []; // Skip directories with permission denied
      throw e;
    }

    let files: string[] = [];
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', '.arch', 'docs', '.venv', 'venv', 'env', '__pycache__', '.pytest_cache', '.mypy_cache'].includes(entry)) continue;
      const fullPath = join(dir, entry);
      const relPath = join(base, entry);
      
      try {
        if (statSync(fullPath).isDirectory()) {
          files = files.concat(this.listAllFiles(fullPath, relPath));
        } else {
          files.push(relPath);
        }
      } catch (e: any) {
        if (e.code === 'EACCES') continue; // Skip individual files/dirs with permission denied
        throw e;
      }
    }
    return files;
  }

  private render(map: ARCHDeploymentMap, verbose: boolean): void {
    const { graph, subsystems, risks, instrumentation } = map;

    // 1. Graph Overview
    fmt.log(`  \x1b[1mUNIFIED EPISTEMIC GRAPH OVERVIEW\x1b[0m`);
    fmt.log(`    Entities:     ${graph.entities.length}`);
    fmt.log(`    Edges:        ${graph.edges.length}`);
    fmt.log(`    Languages:    ${graph.metadata.languageCoverage.join(', ')}`);
    fmt.log(`    Completeness: ${graph.metadata.completeness}\n`);

    // 2. Subsystem Views (Emergent only, no roles)
    fmt.log(`  \x1b[1mEMERGENT SUBSYSTEM VIEWS (${subsystems.length})\x1b[0m`);
    // Note: No sorting or ranking as per v1.1 constraint 8.1
    for (const s of subsystems.slice(0, 5)) {
      fmt.log(`    \x1b[36mStructural View:\x1b[0m ${s.entities.length} entities, ${s.relations.length} relations`);
      if (verbose) {
        const topEntities = s.entities.slice(0, 3).map(e => e.name).join(', ');
        fmt.log(`      \x1b[90mSample: ${topEntities}...\x1b[0m`);
      }
    }
    if (subsystems.length > 5) fmt.log(`    ... and ${subsystems.length - 5} more views.`);
    fmt.log('');

    // 3. Structural Risks (Descriptive only, no severity levels)
    if (risks.length > 0) {
      fmt.log(`  \x1b[31m\x1b[1mSTRUCTURAL OBSERVATIONS (${risks.length})\x1b[0m`);
      for (const risk of risks.slice(0, 5)) {
        fmt.log(`    \x1b[31m[${risk.type}]\x1b[0m ${risk.entities[0]}`);
        fmt.log(`    \x1b[90mObservation: ${risk.observation}\x1b[0m`);
        fmt.log(`    \x1b[90mCondition:   ${risk.structuralCondition}\x1b[0m`);
      }
      fmt.log('');
    }

    // 4. Instrumentation Suggestions (Unordered)
    fmt.log(`  \x1b[32m\x1b[1mINSTRUMENTATION SUGGESTIONS (${instrumentation.length})\x1b[0m`);
    for (const suggest of instrumentation.slice(0, 5)) {
      fmt.log(`    \x1b[32m[${suggest.hookType.padEnd(22)}]\x1b[0m ${suggest.entityId}`);
      if (verbose) fmt.log(`      \x1b[90mReason: ${suggest.reason}\x1b[0m`);
    }
    if (instrumentation.length > 5) {
      fmt.log(`    ... and ${instrumentation.length - 5} more suggestions.`);
    }
    fmt.log('');

    fmt.log(`  \x1b[90mNote: ARCH v1.1 is a structural decomposition engine. Labels and views are emergent lenses, not truth claims.\x1b[0m\n`);
  }
}
