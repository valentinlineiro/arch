/**
 * CausalGraph — reduced to a no-op stub (TASK-1103).
 * Graph traversal machinery removed. This stub satisfies existing callers.
 */
export interface CausalEdge { from: string; to: string; type: string; }
export interface CausalNode { id: string; type: string; label: string; }

export class CausalGraph {
  constructor(_fileSystem?: unknown, _rootPath?: string) {}

  readonly nodes: CausalNode[] = [];
  readonly edges: CausalEdge[] = [];

  async add(_from: string, _type: string, _to: string): Promise<void> {}
  async load(): Promise<void> {}
  addNode(_node: CausalNode): void {}
  addEdge(_edge: CausalEdge): void {}
  getNeighbors(_id: string): CausalNode[] { return []; }
  getDirectPaths(_from: string, _to: string): string[][] { return []; }
  toJSON(): object { return { nodes: this.nodes, edges: this.edges }; }
}
