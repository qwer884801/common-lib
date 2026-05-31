import ELK from 'elkjs/lib/elk.bundled.js';
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk.bundled.js';
import type { WorkflowGraphEdge, WorkflowGraphNode } from './types';

export const WORKFLOW_NODE_WIDTH = 238;
export const WORKFLOW_NODE_HEIGHT = 96;

const elk = new ELK({
  defaultLayoutOptions: {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '42',
    'elk.layered.spacing.nodeNodeBetweenLayers': '84',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.cycleBreaking.strategy': 'GREEDY',
    'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
    'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED'
  }
});

export async function layoutWorkflowGraph(nodes: WorkflowGraphNode[], edges: WorkflowGraphEdge[]) {
	if (!nodes.length) return [];
	const authored = authoredPositionLayout(nodes);
	if (authored.length) return authored;
	const graph = await elk.layout(toElkGraph(nodes, edges));
	const layouted = new Map((graph.children || []).map((node) => [node.id, node]));
	return nodes.map((node) => {
    const layoutedNode = layouted.get(node.id);
    return {
      ...node,
      position: {
        x: layoutedNode?.x ?? 0,
        y: layoutedNode?.y ?? 0
      }
    };
	});
}

function authoredPositionLayout(nodes: WorkflowGraphNode[]) {
	const positioned = nodes.filter((node) => node.position);
	if (positioned.length / nodes.length < 0.7) return [];
	const points = nodes.map((node) => node.position || { x: 0, y: 0 });
	const minX = Math.min(...points.map((point) => point.x));
	const minY = Math.min(...points.map((point) => point.y));
	return nodes.map((node) => {
		const point = node.position || { x: 0, y: 0 };
		return {
			...node,
			position: {
				x: Math.round(point.x - minX + 24),
				y: Math.round(point.y - minY + 24)
			}
		};
	});
}

function toElkGraph(nodes: WorkflowGraphNode[], edges: WorkflowGraphEdge[]): ElkNode {
	const ids = new Set(nodes.map((node) => node.id));
  return {
    id: 'workflow-root',
    children: nodes.map((node) => ({
      id: node.id,
      width: WORKFLOW_NODE_WIDTH,
      height: WORKFLOW_NODE_HEIGHT
    })),
    edges: edges.flatMap((edge, index) => toElkEdge(edge, index, ids))
  };
}

function toElkEdge(edge: WorkflowGraphEdge, index: number, nodeIDs: Set<string>): ElkExtendedEdge[] {
  if (!nodeIDs.has(edge.source) || !nodeIDs.has(edge.target)) return [];
  return [{
    id: edge.id || `${edge.source}->${edge.target}-${index}`,
    sources: [edge.source],
    targets: [edge.target]
  }];
}
