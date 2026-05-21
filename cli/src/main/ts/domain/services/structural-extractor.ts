
import { DependencyGraph } from '../models/deployment-map.js';
import { FileSystem } from '../repositories/file-system.js';
import { join, dirname, extname } from 'node:path';

export interface ExtractionResult {
  languages: string[];
  entrypoints: string[];
  buildSystem: string[];
  graph: DependencyGraph;
  files: string[];
}

export class StructuralExtractor {
  constructor(private fileSystem: FileSystem, private rootPath: string) {}

  async extract(): Promise<ExtractionResult> {
    const allFiles = await this.listAllFiles(this.rootPath);
    const languages = this.detectLanguages(allFiles);
    const buildSystem = await this.detectBuildSystem();
    const entrypoints = await this.findEntrypoints();
    
    const graph: DependencyGraph = { nodes: [], edges: [] };
    const relevantFiles = allFiles.filter(f => /\.(ts|js|tsx|jsx|mjs|cjs)$/.test(f));

    for (const file of relevantFiles) {
      graph.nodes.push({ id: file, type: 'file' });
      const imports = await this.extractImports(file);
      for (const imp of imports) {
        const resolved = this.resolveImport(file, imp, relevantFiles);
        if (resolved) {
          graph.edges.push({ from: file, to: resolved, weight: 1 });
        }
      }
    }

    return {
      languages,
      entrypoints,
      buildSystem,
      graph,
      files: allFiles,
    };
  }

  private async listAllFiles(dir: string, base: string = ''): Promise<string[]> {
    const entries = await this.fileSystem.readDirectory(dir);
    let files: string[] = [];

    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', '.arch', 'docs'].includes(entry)) continue;
      
      const fullPath = join(dir, entry);
      const relPath = join(base, entry);
      
      // Heuristic: check if it's a directory by trying to read it
      try {
        const subEntries = await this.listAllFiles(fullPath, relPath);
        files = files.concat(subEntries);
      } catch {
        files.push(relPath);
      }
    }
    return files;
  }

  private detectLanguages(files: string[]): string[] {
    const exts = new Set(files.map(f => extname(f).toLowerCase()));
    const langs: string[] = [];
    if (exts.has('.ts') || exts.has('.tsx')) langs.push('typescript');
    if (exts.has('.js') || exts.has('.jsx') || exts.has('.mjs')) langs.push('javascript');
    if (exts.has('.py')) langs.push('python');
    if (exts.has('.go')) langs.push('go');
    if (exts.has('.rs')) langs.push('rust');
    return langs;
  }

  private async detectBuildSystem(): Promise<string[]> {
    const systems: string[] = [];
    if (await this.fileSystem.exists(join(this.rootPath, 'package.json'))) systems.push('npm/yarn');
    if (await this.fileSystem.exists(join(this.rootPath, 'tsconfig.json'))) systems.push('tsc');
    if (await this.fileSystem.exists(join(this.rootPath, 'Cargo.toml'))) systems.push('cargo');
    if (await this.fileSystem.exists(join(this.rootPath, 'go.mod'))) systems.push('go-modules');
    return systems;
  }

  private async findEntrypoints(): Promise<string[]> {
    const entrypoints: string[] = [];
    try {
      const pkg = JSON.parse(await this.fileSystem.readFile(join(this.rootPath, 'package.json')));
      if (pkg.main) entrypoints.push(pkg.main);
      if (pkg.bin) {
        if (typeof pkg.bin === 'string') entrypoints.push(pkg.bin);
        else entrypoints.push(...Object.values(pkg.bin as Record<string, string>));
      }
    } catch { /* ignore */ }

    // Common patterns
    const commons = ['src/index.ts', 'src/main.ts', 'index.ts', 'main.ts', 'src/index.js', 'index.js'];
    for (const c of commons) {
      if (await this.fileSystem.exists(join(this.rootPath, c)) && !entrypoints.includes(c)) {
        entrypoints.push(c);
      }
    }

    return entrypoints;
  }

  private async extractImports(file: string): Promise<string[]> {
    try {
      const content = await this.fileSystem.readFile(join(this.rootPath, file));
      const imports: string[] = [];
      
      // Static imports/exports
      const staticRegex = /(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = staticRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // Dynamic imports
      const dynamicRegex = /import\(['"]([^'"]+)['"]\)/g;
      while ((match = dynamicRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      // require
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }

      return [...new Set(imports)];
    } catch {
      return [];
    }
  }

  private resolveImport(sourceFile: string, importPath: string, allFiles: string[]): string | null {
    if (!importPath.startsWith('.')) return null; // Ignore external/node_modules for MVP graph

    const sourceDir = dirname(sourceFile);
    // Handle ESM mapping: if import ends in .js but we are in TS, it might be a .ts file
    const cleanImportPath = importPath.endsWith('.js') ? importPath.slice(0, -3) : importPath;

    const candidates = [
      join(sourceDir, importPath),
      join(sourceDir, cleanImportPath + '.ts'),
      join(sourceDir, cleanImportPath + '.tsx'),
      join(sourceDir, cleanImportPath + '.js'),
      join(sourceDir, cleanImportPath + '/index.ts'),
      join(sourceDir, cleanImportPath + '/index.js'),
    ].map(c => c.replace(/\\/g, '/'));

    for (const c of candidates) {
      if (allFiles.includes(c)) return c;
    }
    return null;
  }
}
