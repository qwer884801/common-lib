import type { ReactNode } from 'react';
import { accountId, accountStatus, accountSubject } from './identity';
import type { AccountRecord, AccountRenderConfig } from './types';

export type AccountSubjectRenderConfigOptions = {
  icon?: (account: AccountRecord) => ReactNode;
  titleClassName?: string;
  showSubtitle?: boolean;
  showStatusMeta?: boolean;
};

export function accountSubjectRenderConfig({
  icon,
  titleClassName = 'font-mono',
  showSubtitle = true,
  showStatusMeta = true,
}: AccountSubjectRenderConfigOptions = {}): AccountRenderConfig {
  return {
    icon,
    title: (account) => <span className={titleClassName}>{accountSubject(account) || accountId(account) || '-'}</span>,
    subtitle: showSubtitle ? (account) => accountId(account) : () => '',
    meta: showStatusMeta ? (account) => <AccountStatusMeta account={account} /> : undefined,
  };
}

export function AccountStatusMeta({ account, className = 'text-xs text-muted-foreground' }: {
  account: AccountRecord;
  className?: string;
}) {
  return <span className={className}>{accountStatus(account)}</span>;
}
