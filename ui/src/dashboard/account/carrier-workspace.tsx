import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { WorkspacePanel } from '../layout';
import { AccountCarrierList, type AccountCarrierListProps } from './carrier-list';
import { accountRecordFromCarrier, type AccountRecordCarrier } from './carrier';
import { AccountDetails } from './details';
import type { AccountRecord } from './types';

export type AccountCarrierWorkspaceProps<T extends AccountRecordCarrier> = AccountCarrierListProps<T> & {
  title?: ReactNode;
  countText?: ReactNode;
  selectedCarrier?: T | null;
  toolbar?: ReactNode;
  details?: ReactNode | ((carrier: T | null, account: AccountRecord | null) => ReactNode);
  listClassName?: string;
  headerClassName?: string;
  detailClassName?: string;
  workspaceClassName?: string;
};

export function AccountCarrierWorkspace<T extends AccountRecordCarrier>({
  carriers,
  recordOf = (carrier) => accountRecordFromCarrier(carrier),
  title,
  countText,
  selectedCarrier,
  toolbar,
  details,
  listClassName,
  headerClassName,
  detailClassName,
  workspaceClassName,
  ...listProps
}: AccountCarrierWorkspaceProps<T>) {
  const selectedAccount = selectedCarrier ? recordOf(selectedCarrier) || null : null;
  return (
    <WorkspacePanel
      workspaceClassName={cn('grid min-h-0 grid-cols-[minmax(280px,360px)_minmax(0,1fr)]', workspaceClassName)}
      panelClassName="contents"
    >
      <div className={cn('min-h-0 border-r border-border/70', listClassName)}>
        {(title || countText !== undefined) && (
          <div className={cn('flex min-w-0 items-center justify-between gap-2 border-b border-border/70 px-3 py-2 text-xs text-muted-foreground', headerClassName)}>
            <strong className="text-sm text-foreground">{title}</strong>
            {countText !== null && <span>{countText ?? `${carriers?.length ?? 0} 个账号`}</span>}
          </div>
        )}
        {toolbar}
        <AccountCarrierList carriers={carriers} recordOf={recordOf} {...listProps} />
      </div>
      <div className={cn('min-h-0 overflow-auto', detailClassName)}>
        {renderDetails(details, selectedCarrier || null, selectedAccount, listProps.config)}
      </div>
    </WorkspacePanel>
  );
}

function renderDetails<T extends AccountRecordCarrier>(
  details: AccountCarrierWorkspaceProps<T>['details'],
  carrier: T | null,
  account: AccountRecord | null,
  config: AccountCarrierWorkspaceProps<T>['config'],
) {
  if (typeof details === 'function') return details(carrier, account);
  if (details !== undefined) return details;
  return <AccountDetails account={account} config={config} />;
}
