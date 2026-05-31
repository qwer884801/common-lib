import type { WorkflowGraphStatus } from './types';

const STATUS_LABELS: Record<WorkflowGraphStatus, string> = {
  pending: '等待',
  running: '运行中',
  waiting: '等待回调',
  succeeded: '成功',
  failed: '失败',
  canceled: '取消',
  skipped: '未执行',
  unknown: '未知'
};

const STATUS_TONES: Record<WorkflowGraphStatus, string> = {
  pending: 'neutral',
  running: 'active',
  waiting: 'active',
  succeeded: 'good',
  failed: 'bad',
  canceled: 'bad',
  skipped: 'neutral',
  unknown: 'neutral'
};

export function normalizeWorkflowGraphStatus(status?: string): WorkflowGraphStatus {
  const value = (status || '').trim().toLowerCase();
  if (!value) return 'unknown';
  if (['created', 'new', 'pending', 'queued'].includes(value)) return 'pending';
  if (['running', 'started', 'in_progress'].includes(value)) return 'running';
  if (['waiting', 'wait', 'blocked'].includes(value)) return 'waiting';
  if (['success', 'succeeded', 'completed', 'done', 'ok'].includes(value)) return 'succeeded';
  if (value.includes('fail') || value.includes('error') || value === 'crashed') return 'failed';
  if (['cancelled', 'canceled', 'aborted'].includes(value)) return 'canceled';
  if (['skipped', 'skip'].includes(value)) return 'skipped';
  return 'unknown';
}

export function workflowGraphStatusLabel(status?: string) {
  return STATUS_LABELS[normalizeWorkflowGraphStatus(status)];
}

export function workflowGraphStatusTone(status?: string) {
  return STATUS_TONES[normalizeWorkflowGraphStatus(status)];
}

export function isWorkflowGraphActive(status?: string) {
  const normalized = normalizeWorkflowGraphStatus(status);
  return normalized === 'running' || normalized === 'waiting';
}
