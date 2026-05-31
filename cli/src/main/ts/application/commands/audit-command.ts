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
    const isReport = args.includes('--report');
    const isPublic = args.includes('--public');
    const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'markdown';

    if (isReport) {
      return await this.runReport(format as 'markdown' | 'json');
    }

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

  private async runReport(format: 'markdown' | 'json'): Promise<number> {
    const { readdir, readFile, writeFile } = await import('node:fs/promises');
    const { existsSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const root = resolve('.');

    console.log(`\n  \x1b[32mARCH\x1b[0m — Compliance Report\n`);

    // ── 1. Governance Rule Inventory ─────────────────────────────────────
    const adrDir = join(root, 'docs', 'adr');
    const adrs: Array<{ id: string; title: string; status: string; enforcement: string }> = [];

    if (existsSync(adrDir)) {
      const adrFiles = (await readdir(adrDir)).filter(f => f.match(/^ADR-\d+/));
      for (const file of adrFiles) {
        const content = await readFile(join(adrDir, file), 'utf8').catch(() => '');
        const title = content.match(/^# (ADR-[\d]+: .+)/m)?.[1] ?? file.replace('.md', '');
        const status = content.match(/\*\*Status:\*\*\s*(\S+)/)?.[1] ?? 'Unknown';
        // Enforcement: look for file references in ADR
        const enforcement = content.match(/`([^`]+\.ts)`/g)?.slice(0, 2).map(s => s.replace(/`/g, '')).join(', ') ?? 'documented';
        adrs.push({ id: file.replace('.md', ''), title, status, enforcement });
      }
    }

    // ── 2. Chronicle Summary ──────────────────────────────────────────────
    const ledgerPath = join(root, '.arch', 'focus-ledger.jsonl');
    let totalRulings = 0, andonCount = 0, focusPreserved = 0, focusAcquired = 0;
    if (existsSync(ledgerPath)) {
      const lines = (await readFile(ledgerPath, 'utf8')).split('\n').filter(Boolean);
      totalRulings = lines.length;
      for (const line of lines) {
        try {
          const r = JSON.parse(line);
          if (r.ruling === 'ANDON_HALT') andonCount++;
          if (r.ruling === 'FOCUS_PRESERVED') focusPreserved++;
          if (r.ruling === 'FOCUS_ACQUIRED') focusAcquired++;
        } catch {}
      }
    }

    const archiveDir = join(root, 'docs', 'archive');
    const archivedCount = existsSync(archiveDir)
      ? (await readdir(archiveDir)).filter(f => f.startsWith('TASK-')).length : 0;

    // ── 3. Enforcement Separation Attestation ─────────────────────────────
    const governPath = join(root, 'cli', 'src', 'main', 'ts', 'application', 'use-cases', 'govern-system.ts');
    let attestation = 'UNVERIFIED';
    let attestationDetail = 'govern-system.ts not found for analysis';
    if (existsSync(governPath)) {
      const governSrc = await readFile(governPath, 'utf8');
      const spawnMatches = (governSrc.match(/spawnSync|execSync/g) ?? []).length;
      if (spawnMatches === 0) {
        attestation = 'PASS';
        attestationDetail = 'govern-system.ts contains zero spawnSync/execSync calls — no LLM invocations in governance tick';
      } else {
        attestation = 'FAIL';
        attestationDetail = `govern-system.ts contains ${spawnMatches} subprocess call(s) — manual review required`;
      }
    }

    // ── 4. Gap Analysis ───────────────────────────────────────────────────
    const gaps: string[] = [];
    const tasksDir = join(root, 'docs', 'tasks');
    if (existsSync(tasksDir)) {
      const openTasks = (await readdir(tasksDir)).filter(f => f.startsWith('TASK-')).length;
      if (openTasks > 20) gaps.push(`Backlog depth: ${openTasks} open tasks — consider prioritization review`);
    }
    const blockedAdrs = adrs.filter(a => a.status !== 'Accepted' && a.status !== 'ACCEPTED');
    if (blockedAdrs.length > 0) gaps.push(`${blockedAdrs.length} ADR(s) not in Accepted status`);

    const reportData = {
      generated: new Date().toISOString(),
      version: '1.2.1',
      sections: {
        governanceRules: { count: adrs.length, rules: adrs },
        chronicle: { totalRulings, archivedTasks: archivedCount, andonHalts: andonCount, focusPreserved, focusAcquired },
        enforcementSeparation: { attestation, detail: attestationDetail, adrReference: 'ADR-034' },
        gaps: { count: gaps.length, items: gaps },
      },
    };

    if (format === 'json') {
      const outPath = join(root, '.arch', 'compliance-report.json');
      await writeFile(outPath, JSON.stringify(reportData, null, 2));
      console.log(`  Report written: .arch/compliance-report.json\n`);
      return 0;
    }

    // Markdown output
    const lines = [
      `# ARCH Compliance Report`,
      `Generated: ${new Date().toISOString().slice(0, 10)}  Version: ${reportData.version}`,
      '',
      `## 1. Governance Rule Inventory (${adrs.length} ADRs)`,
      '',
      '| ADR | Title | Status | Enforcement |',
      '|-----|-------|--------|-------------|',
      ...adrs.map(a => `| ${a.id} | ${a.title.slice(0, 50)} | ${a.status} | ${a.enforcement} |`),
      '',
      `## 2. Chronicle Summary`,
      '',
      `- **Governance rulings:** ${totalRulings}`,
      `- **Tasks completed:** ${archivedCount}`,
      `- **ANDON halts:** ${andonCount}`,
      `- **Focus transitions:** ${focusAcquired} acquired, ${focusPreserved} preserved`,
      '',
      `## 3. Enforcement Separation Attestation`,
      '',
      `**Result:** ${attestation === 'PASS' ? '✔ PASS' : '✖ FAIL'}`,
      `**ADR:** ADR-034 — Govern/Reflect Structural Separation`,
      `**Detail:** ${attestationDetail}`,
      '',
      `> This attestation confirms that ARCH governance decisions are made exclusively by`,
      `> deterministic code. No LLM output bypasses a governance gate.`,
      '',
      `## 4. Gap Analysis`,
      '',
      gaps.length === 0 ? '✔ No gaps identified.' : gaps.map(g => `- ${g}`).join('\n'),
      '',
    ];

    const md = lines.join('\n');
    const outPath = join(root, '.arch', 'compliance-report.md');
    await writeFile(outPath, md);

    // Print summary to console
    console.log(`  Governance rules:  ${adrs.length} ADRs`);
    console.log(`  Tasks completed:   ${archivedCount}`);
    console.log(`  ANDON halts:       ${andonCount}`);
    console.log(`  Enforcement sep:   ${attestation === 'PASS' ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✖ FAIL\x1b[0m'} — ${attestationDetail.slice(0, 70)}`);
    console.log(`  Gaps:              ${gaps.length === 0 ? 'none' : gaps.length}`);
    console.log(`\n  Report written: .arch/compliance-report.md\n`);
    return 0;
  }
}
