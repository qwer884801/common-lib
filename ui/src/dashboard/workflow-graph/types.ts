import type { ReactNode } from 'react';

export type WorkflowGraphStatus = 'pending' | 'running' | 'waiting' | 'succeeded' | 'failed' | 'canceled' | 'skipped' | 'unknown';

export type WorkflowGraphPosition = {
  x: number;
  y: number;
};

export type WorkflowGraphNode = {
  id: string;
  label: string;
  subtitle?: string;
  kind?: string;
  status?: WorkflowGraphStatus | string;
  startedAt?: string;
  completedAt?: string;
  duration?: string;
  message?: string;
  error?: string;
  order?: number;
  position?: WorkflowGraphPosition;
};

export type WorkflowGraphEdge = {
  id?: string;
  source: string;
  target: string;
  label?: string;
  status?: WorkflowGraphStatus | string;
};

export type WorkflowGraphProps = {
  nodes: WorkflowGraphNode[];
  edges?: WorkflowGraphEdge[];
  selectedNodeId?: string;
  emptyText?: string;
  fitView?: boolean;
  initialZoom?: number;
  showNodeStatus?: boolean;
  showControls?: boolean;
  showMiniMap?: boolean;
  className?: string;
  renderNodeIcon?: (node: WorkflowGraphNode) => ReactNode;
  onNodeSelect?: (node: WorkflowGraphNode) => void;
  onPaneClick?: () => void;
};
