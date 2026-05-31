import type { ReactNode } from 'react';
import { RecordList } from '../common/records';
import { CursorPager } from '../common/cursor-pager';
import { AccountCard } from './card';
import { accountKey } from './identity';
import type { AccountRecord, AccountRenderConfig } from './types';

export type AccountListPagination = {
  pageSize?: number;
  hasNext?: boolean;
  loading?: boolean;
  nextText?: string;
  onLoadMore: () => void;
};

export function AccountList({ accounts, selectedKey, onSelect, config, pagination, emptyText = 'No accounts', children, className }: {
  accounts: AccountRecord[];
  selectedKey?: string;
  onSelect?: (account: AccountRecord) => void;
  config?: AccountRenderConfig;
  pagination?: AccountListPagination;
  emptyText?: string;
  children?: (account: AccountRecord) => ReactNode;
  className?: string;
}) {
  return (
    <>
      <RecordList emptyText={emptyText} className={className}>
        {accounts.map((account) => (
          <AccountCard
            key={accountKey(account)}
            account={account}
            selected={accountKey(account) === selectedKey}
            onSelect={onSelect}
            config={config}
          >
            {children?.(account)}
          </AccountCard>
        ))}
      </RecordList>
      <AccountPager itemCount={accounts.length} pagination={pagination} />
    </>
  );
}

export function AccountPager({ itemCount, pagination }: { itemCount: number; pagination?: AccountListPagination }) {
  if (!pagination) return null;
  return (
    <CursorPager
      itemCount={itemCount}
      pageSize={pagination.pageSize}
      hasNext={pagination.hasNext}
      loading={pagination.loading}
      nextText={pagination.nextText}
      onNext={pagination.onLoadMore}
    />
  );
}
