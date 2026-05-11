import type { FileSystem } from '../../domain/repositories/file-system.js';
import { VALID_RELATIONS, type CausalRelation, type RelationType } from '../../domain/models/causal-relation.js';

const GRAPH_PATH = '.arch/causal-graph.jsonl';

export { VALID_RELATIONS };

export class CausalGraph {
  constructor(
    private fileSystem: FileSystem,
    private rootPath: string,
  ) {}

  async add(from: string, relation: RelationType, to: string, note?: string): Promise<CausalRelation> {
    const entry: CausalRelation = {
      from,
      to,
      relation,
      timestamp: new Date().toISOString(),
      ...(note ? { note } : {}),
    };
    await this.fileSystem.appendFile(`${this.rootPath}/${GRAPH_PATH}`, JSON.stringify(entry) + '\n');
    return entry;
  }

  async query(entity: string): Promise<{ outgoing: CausalRelation[]; incoming: CausalRelation[] }> {
    const all = await this.all();
    return {
      outgoing: all.filter(r => r.from === entity),
      incoming: all.filter(r => r.to === entity),
    };
  }

  async all(): Promise<CausalRelation[]> {
    let raw: string;
    try {
      raw = await this.fileSystem.readFile(`${this.rootPath}/${GRAPH_PATH}`);
    } catch {
      return [];
    }
    return raw.trim().split('\n').filter(Boolean).map(l => JSON.parse(l) as CausalRelation);
  }
}
