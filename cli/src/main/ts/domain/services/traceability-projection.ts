import type { GraphNode, GraphEdge, TraceabilityEvent } from '../models/traceability-graph.js';

/**
 * Deterministic Projection Engine.
 * Replays evidence events to reconstruct the graph state at any point in time.
 */
export class TraceabilityProjection {
  private nodes = new Map<string, GraphNode>();
  private edges = new Map<string, GraphEdge>();

  /**
   * Applies an event to the current state.
   */
  apply(event: TraceabilityEvent): void {
    switch (event.type) {
      case 'NODE_DISCOVERED':
        this.nodes.set(event.node.id, { ...event.node });
        break;
      
      case 'EDGE_DECLARED':
        this.edges.set(event.edge.id, { ...event.edge });
        break;
      
      case 'EDGE_DEPRECATED':
        const edge = this.edges.get(event.edgeId);
        if (edge) {
          edge.validity.status = 'deprecated';
          edge.validity.reason = event.reason;
          edge.updatedAt = event.timestamp;
        }
        break;
    }
  }

  /**
   * Replays a full stream of events.
   */
  replay(events: TraceabilityEvent[]): void {
    this.nodes.clear();
    this.edges.clear();
    for (const event of events) {
      this.apply(event);
    }
  }

  // --- Queries ---

  getNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getEdges(onlyActive: boolean = true): GraphEdge[] {
    const all = Array.from(this.edges.values());
    return onlyActive ? all.filter(e => e.validity.status === 'active') : all;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Returns all edges connected to a node.
   */
  getConnectedEdges(nodeId: string): GraphEdge[] {
    return this.getEdges().filter(e => e.from === nodeId || e.to === nodeId);
  }
}
