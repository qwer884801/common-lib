import type { ReactNode } from 'react';
import { AccountList, type AccountListPagination } from './list';
import { cn } from '../../lib/utils';
import {
  accountCarrierID,
  accountCarrierKey,
  accountRecordFromCarrier,
  type AccountRecordCarrier,
} from './carrier';
import { accountId, accountKey } from './identity';
import type { AccountAction, AccountRecord, AccountRenderConfig } from './types';

export type AccountCarrierActionFactory<T extends AccountRecordCarrier> = (carrier: T, record: AccountRecord) => AccountAction[];

export type AccountCarrierListProps<T extends AccountRecordCarrier> = {
  carriers?: readonly T[] | null;
  recordOf?: (carrier: T) => AccountRecord | undefined;
  selectedID?: string;
  selectedKey?: string;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  listClassName?: string;
  config?: AccountRenderConfig;
  carrierActions?: AccountCarrierActionFactory<T>;
  pagination?: AccountListPagination;
  pageSize?: number;
  hasNext?: boolean;
  loadingNext?: boolean;
  nextText?: string;
  onLoadMore?: () => void | Promise<void>;
  onSelectCarrier?: (carrier: T) => void;
  renderChildren?: (carrier: T, record: AccountRecord) => ReactNode;
};

export type AccountCarrierPanelProps<T extends AccountRecordCarrier> = AccountCarrierListProps<T> & {
  title: ReactNode;
  countText?: ReactNode;
  actions?: ReactNode;
  className?: string;
  headerClassName?: string;
};

export function AccountCarrierPanel<T extends AccountRecordCarrier>({ title, countText, actions, className, headerClassName, carriers, ...listProps }: AccountCarrierPanelProps<T>) {
  return (
    <section className={cn('grid gap-2', className)}>
      <div className={cn('flex min-w-0 items-center justify-between gap-2 text-xs text-muted-foreground', headerClassName)}>
        <strong className="text-sm text-foreground">{title}</strong>
        <div className="flex shrink-0 items-center gap-2">
          {countText !== null && <span>{countText ?? `${carriers?.length ?? 0} 个账号`}</span>}
          {actions}
        </div>
      </div>
      <AccountCarrierList carriers={carriers} {...listProps} />
    </section>
  );
}

export function AccountCarrierList<T extends AccountRecordCarrier>({
  carriers,
  recordOf = (carrier) => accountRecordFromCarrier(carrier),
  selectedID,
  selectedKey,
  loading,
  loadingText = '加载账号...',
  emptyText = 'No accounts',
  listClassName,
  config,
  carrierActions,
  pagination,
  pageSize,
  hasNext,
  loadingNext,
  nextText,
  onLoadMore,
  onSelectCarrier,
  renderChildren,
}: AccountCarrierListProps<T>) {
  const pairs = accountCarrierPairs(carriers, recordOf);
  const records = pairs.map((pair) => pair.record);
  if (loading && records.length === 0) {
    return <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{loadingText}</div>;
  }
  const byKey = new Map(pairs.map((pair) => [accountKey(pair.record), pair.carrier] as const));
  return (
    <AccountList
      accounts={records}
      className={listClassName}
      selectedKey={selectedKey || accountCarrierSelectedKey(pairs, selectedID)}
      emptyText={emptyText}
      onSelect={onSelectCarrier ? (record) => {
        const carrier = byKey.get(accountKey(record));
        if (carrier) onSelectCarrier(carrier);
      } : undefined}
      config={accountCarrierRenderConfig(config, carrierActions, (record) => byKey.get(accountKey(record)))}
      pagination={pagination || accountCarrierPagination({ pageSize, hasNext, loadingNext, nextText, onLoadMore })}
      children={renderChildren ? (record) => {
        const carrier = byKey.get(accountKey(record));
        return carrier ? renderChildren(carrier, record) : null;
      } : undefined}
    />
  );
}

function accountCarrierPairs<T extends AccountRecordCarrier>(carriers: readonly T[] | null | undefined, recordOf: (carrier: T) => AccountRecord | undefined) {
  return (carriers || []).flatMap((carrier) => {
    const record = recordOf(carrier);
    return record ? [{ carrier, record }] : [];
  });
}

function accountCarrierSelectedKey<T extends AccountRecordCarrier>(pairs: Array<{ carrier: T; record: AccountRecord }>, selectedID?: string) {
  const id = (selectedID || '').trim();
  if (!id) return '';
  const pair = pairs.find((item) => accountId(item.record) === id || accountKey(item.record) === id || accountCarrierID(item.carrier) === id || accountCarrierKey(item.carrier) === id);
  return pair ? accountKey(pair.record) : '';
}

function accountCarrierPagination({ pageSize, hasNext, loadingNext, nextText, onLoadMore }: Pick<AccountCarrierListProps<AccountRecordCarrier>, 'pageSize' | 'hasNext' | 'loadingNext' | 'nextText' | 'onLoadMore'>): AccountListPagination | undefined {
  if (!onLoadMore) return undefined;
  return { pageSize, hasNext, loading: loadingNext, nextText, onLoadMore };
}

function accountCarrierRenderConfig<T extends AccountRecordCarrier>(
  config: AccountRenderConfig | undefined,
  carrierActions: AccountCarrierActionFactory<T> | undefined,
  carrierOf: (record: AccountRecord) => T | undefined,
): AccountRenderConfig | undefined {
  if (!carrierActions) return config;
  return {
    ...config,
    actions: (record) => {
      const carrier = carrierOf(record);
      return [...(config?.actions?.(record) || []), ...(carrier ? carrierActions(carrier, record) : [])];
    },
  };
}
