import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Braces, Clock3, Code2, GitBranch, Globe2, MousePointerClick, Play, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { workflowGraphStatusLabel, workflowGraphStatusTone } from './status';
import type { WorkflowGraphNode } from './types';

type WorkflowNodeData = WorkflowGraphNode & {
  selected?: boolean;
  showStatus?: boolean;
  renderIcon?: (node: WorkflowGraphNode) => ReactNode;
};

export function WorkflowNode({ data }: NodeProps) {
  const node = data as WorkflowNodeData;
  const tone = workflowGraphStatusTone(node.status);
  return (
    <div className={`workflowGraphNode ${tone} ${node.selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="workflowGraphHandle" />
      <span className="workflowGraphNodeIcon">{node.renderIcon?.(node) || defaultIcon(node.kind)}</span>
      <div className="workflowGraphNodeHeader">
        <strong>{node.label}</strong>
        {node.showStatus && <em>{workflowGraphStatusLabel(node.status)}</em>}
      </div>
      {(node.subtitle || node.kind) && <div className="workflowGraphNodeMeta">{node.subtitle || node.kind}</div>}
      {(node.duration || node.startedAt || node.completedAt) && (
        <div className="workflowGraphNodeTime">{node.duration || [node.startedAt, node.completedAt].filter(Boolean).join(' → ')}</div>
      )}
      {node.message && <div className="workflowGraphNodeMessage">{node.message}</div>}
      {node.error && <div className="workflowGraphNodeError">{trim(node.error)}</div>}
      <Handle type="source" position={Position.Right} className="workflowGraphHandle" />
    </div>
  );
}

function defaultIcon(kind = '') {
  const Icon = iconForKind(kind);
  return <Icon size={15} strokeWidth={2.4} />;
}

function iconForKind(kind: string): LucideIcon {
  const value = kind.toLowerCase();
  if (value.includes('trigger')) return Play;
  if (value.includes('if') || value.includes('switch')) return GitBranch;
  if (value.includes('code')) return Code2;
  if (value.includes('wait')) return Clock3;
  if (value.includes('http') || value.includes('webhook')) return Globe2;
  if (value.includes('manual') || value.includes('execute')) return MousePointerClick;
  return Braces;
}

function trim(value: string) {
  return value.length > 140 ? `${value.slice(0, 140)}…` : value;
}
