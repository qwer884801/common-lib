import { useEffect, useMemo, useState } from 'react';
import { Background, Controls, MarkerType, MiniMap, Position, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import { SmartBezierEdge } from '@tisoap/react-flow-smart-edge';
import { EmptyBlock } from '../common/empty';
import { cn } from '../../lib/utils';
import { isWorkflowGraphActive, workflowGraphStatusTone } from './status';
import { WORKFLOW_NODE_HEIGHT, WORKFLOW_NODE_WIDTH, layoutWorkflowGraph } from './layout';
import { WorkflowNode } from './workflow-node';
import type { WorkflowGraphNode, WorkflowGraphProps } from './types';

const edgeTypes = { smartBezier: SmartBezierEdge };
const nodeTypes = { workflow: WorkflowNode };
type FlowModel = { key: string; nodes: Node[]; edges: Edge[] };

export function WorkflowGraph({
  nodes,
  edges = [],
  selectedNodeId,
  emptyText = '暂无流程节点',
  fitView = true,
  initialZoom = 0.82,
  showNodeStatus = true,
  showControls = true,
  showMiniMap = false,
  className,
  renderNodeIcon,
  onNodeSelect,
  onPaneClick
}: WorkflowGraphProps) {
  const flowKey = useMemo(() => graphKey(nodes, edges, selectedNodeId, showNodeStatus), [nodes, edges, selectedNodeId, showNodeStatus]);
  const [flow, setFlow] = useState<FlowModel | null>(null);
  const [layoutFailed, setLayoutFailed] = useState(false);
  useEffect(() => {
    if (!nodes.length) return;
    let active = true;
    setFlow(null);
    setLayoutFailed(false);
    toReactFlow(nodes, edges, selectedNodeId, flowKey, showNodeStatus, renderNodeIcon).then((next) => {
      if (active) setFlow(next);
    }).catch(() => {
      if (active) setLayoutFailed(true);
    });
    return () => {
      active = false;
    };
  }, [nodes, edges, selectedNodeId, flowKey, showNodeStatus, renderNodeIcon]);
  if (!nodes.length) return <EmptyBlock text={emptyText} />;
  if (layoutFailed) return <EmptyBlock text="流程布局失败" />;
  if (!flow) return <EmptyBlock text="正在计算流程布局…" />;

  return (
    <div className={cn('workflowGraphShell', className)}>
      <ReactFlowProvider>
        <WorkflowGraphCanvas
          flow={flow}
          fitView={fitView}
          initialZoom={initialZoom}
          showControls={showControls}
          showMiniMap={showMiniMap}
          onNodeSelect={onNodeSelect}
          onPaneClick={onPaneClick}
        />
      </ReactFlowProvider>
    </div>
  );
}

function WorkflowGraphCanvas({ flow, fitView, initialZoom, showControls, showMiniMap, onNodeSelect, onPaneClick }: {
  flow: FlowModel;
  fitView: boolean;
  initialZoom: number;
  showControls: boolean;
  showMiniMap: boolean;
  onNodeSelect?: (node: WorkflowGraphNode) => void;
  onPaneClick?: () => void;
}) {
  const showGraphExtras = useDeferredGraphExtras(flow);
  return (
    <ReactFlow
      key={flow.key}
      nodes={flow.nodes}
      edges={showGraphExtras ? flow.edges : []}
      edgeTypes={edgeTypes}
      nodeTypes={nodeTypes}
      fitView={fitView}
      fitViewOptions={{ padding: 0.24 }}
      defaultViewport={fitView ? undefined : { x: 18, y: 18, zoom: initialZoom }}
      minZoom={0.04}
      maxZoom={1.8}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={Boolean(onNodeSelect)}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => onNodeSelect?.(node.data as WorkflowGraphNode)}
      onPaneClick={onPaneClick}
    >
      <Background gap={18} size={1} />
      {showControls && <Controls showInteractive={false} />}
      {showMiniMap && showGraphExtras && <MiniMap pannable zoomable nodeStrokeWidth={3} />}
    </ReactFlow>
  );
}

function useDeferredGraphExtras(flow: FlowModel) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(first);
      if (second) cancelAnimationFrame(second);
    };
  }, [flow]);
  return ready;
}

async function toReactFlow(
  nodes: WorkflowGraphNode[],
  edges: NonNullable<WorkflowGraphProps['edges']>,
  selectedNodeId: string | undefined,
  key: string,
  showNodeStatus: boolean,
  renderNodeIcon?: WorkflowGraphProps['renderNodeIcon']
) {
  const layouted = await layoutWorkflowGraph(nodes, edges);
  const idMap = new Map(layouted.map((node) => [node.id, flowID(node.id)]));
  return {
    key,
    nodes: layouted.map<Node>((node) => ({
      id: idMap.get(node.id) || flowID(node.id),
      type: 'workflow',
      data: { ...node, selected: node.id === selectedNodeId, showStatus: showNodeStatus, renderIcon: renderNodeIcon },
      position: node.position || { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      width: WORKFLOW_NODE_WIDTH,
      height: WORKFLOW_NODE_HEIGHT,
      measured: { width: WORKFLOW_NODE_WIDTH, height: WORKFLOW_NODE_HEIGHT },
      style: { width: WORKFLOW_NODE_WIDTH },
      selectable: true
    })),
    edges: edges.filter((edge) => idMap.has(edge.source) && idMap.has(edge.target)).map<Edge>((edge) => {
      const tone = workflowGraphStatusTone(edge.status);
      return {
        id: flowID(edge.id || `${edge.source}->${edge.target}`),
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        label: edge.label,
        type: 'smartBezier',
        animated: isWorkflowGraphActive(edge.status),
        className: `workflowGraphEdge ${tone}`,
        markerEnd: { type: MarkerType.ArrowClosed }
      };
    })
  };
}

function graphKey(nodes: WorkflowGraphNode[], edges: NonNullable<WorkflowGraphProps['edges']>, selectedNodeId?: string, showNodeStatus?: boolean) {
  return [
    nodes.map((node) => `${node.id}:${node.status || ''}`).join('|'),
    edges.map((edge) => `${edge.source}->${edge.target}:${edge.status || ''}`).join('|'),
    selectedNodeId || '',
    showNodeStatus ? 'status' : 'definition'
  ].join('::');
}

function flowID(value: string) {
  return `wf-${encodeURIComponent(value || 'node').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}
