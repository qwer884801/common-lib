import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { PanelHeader } from '../common/panels';
import { AccountCarrierList, type AccountCarrierListProps } from './carrier-list';
import type { AccountRecordCarrier } from './carrier';

export type AccountManagementFrameProps = {
  title: ReactNode;
  icon: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerControlsClassName?: string;
  bodyClassName?: string;
};

export function AccountManagementFrame({
  title,
  icon,
  actions,
  children,
  className,
  headerControlsClassName,
  bodyClassName,
}: AccountManagementFrameProps) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <PanelHeader title={title} icon={icon}>
        {actions && (
          <div className={cn('headerControls accountHeaderControls', headerControlsClassName)}>
            {actions}
          </div>
        )}
      </PanelHeader>
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

export type AccountManagementViewProps<T extends AccountRecordCarrier> =
  AccountCarrierListProps<T> & {
    title: ReactNode;
    icon: ReactNode;
    actions?: ReactNode;
    className?: string;
    headerControlsClassName?: string;
    bodyClassName?: string;
  };

export function AccountManagementView<T extends AccountRecordCarrier>({
  title,
  icon,
  actions,
  className,
  headerControlsClassName,
  bodyClassName,
  listClassName,
  ...listProps
}: AccountManagementViewProps<T>) {
  return (
    <AccountManagementFrame
      title={title}
      icon={icon}
      actions={actions}
      className={className}
      headerControlsClassName={headerControlsClassName}
      bodyClassName={bodyClassName}
    >
      <AccountCarrierList {...listProps} listClassName={cn('accountManagementList', listClassName)} />
    </AccountManagementFrame>
  );
}
