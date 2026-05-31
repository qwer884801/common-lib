import type { ReactNode } from 'react';
import { ActionButtonGroup, RecordActionButtons } from '../common/actions';
import type { ActionButtonDescriptor } from '../common/actions';
import type { RowActionDescriptor } from '../types';

export function AccountActionRows({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={classNames('detailActionRows', className)}>{children}</div>;
}

export function AccountActionRow({ label, actions, children, className, contentClassName, buttonGroupClassName = 'sectionActions' }: {
  label?: ReactNode;
  actions?: ActionButtonDescriptor[];
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  buttonGroupClassName?: string;
}) {
  if (actions && !hasVisibleAction(actions)) return null;
  return (
    <div className={classNames('detailActionRow', label ? '' : 'unlabeled', className)}>
      {label && <span className="detailActionLabel">{label}</span>}
      {actions ? <ActionButtonGroup className={buttonGroupClassName} actions={actions} /> : <div className={contentClassName}>{children}</div>}
    </div>
  );
}

export function AccountRowActionGroups({ actions, className, groupClassName }: {
  actions: RowActionDescriptor[];
  className?: string;
  groupClassName?: string;
}) {
  if (actions.length === 0) return null;
  return (
    <div className={classNames('rowAuthGroups', className)}>
      <span className={classNames('rowActionGroup', groupClassName)}><RecordActionButtons actions={actions} /></span>
    </div>
  );
}

export function hasVisibleAction(actions: { visible?: boolean }[]) {
  return actions.some((action) => action.visible !== false);
}

function classNames(...values: (string | undefined)[]) {
  return values.map((value) => value?.trim()).filter(Boolean).join(' ');
}
