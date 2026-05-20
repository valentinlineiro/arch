
export class NoiseFilter {
  private ignorePatterns: RegExp[] = [
    /node_modules\//,
    /dist\//,
    /build\//,
    /coverage\//,
    /\.generated\./,
    /package-lock\.json/,
    /pnpm-lock\.yaml/,
    /yarn\.lock/,
    /\.git\//,
    /\.arch\//,
  ];

  constructor(customPatterns: RegExp[] = []) {
    this.ignorePatterns = [...this.ignorePatterns, ...customPatterns];
  }

  shouldIgnore(file: string): boolean {
    return this.ignorePatterns.some(p => p.test(file));
  }
}
