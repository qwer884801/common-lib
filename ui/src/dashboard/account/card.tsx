import type { ReactNode } from 'react';
import { StatusBadge } from '../common/status';
import { RecordActions, RecordCard, RecordIdentity, RecordMain, RecordMeta, RecordTop } from '../common/records';
import { AccountActionBar } from './actions';
import { AccountCredentialChips } from './credentials';
import { accountKey, accountStatus, accountSubtitle, accountTitle } from './identity';
import type { AccountRecord, AccountRenderConfig } from './types';

export function AccountCard({ account, selected, onSelect, config = {}, children }: {
  account: AccountRecord;
  selected?: boolean;
  onSelect?: (account: AccountRecord) => void;
  config?: AccountRenderConfig;
  children?: ReactNode;
}) {
  const actions = config.actions?.(account) || [];
  const title = config.title?.(account) ?? accountTitle(account);
  const subtitle = config.subtitle?.(account) ?? accountSubtitle(account);
  const meta = config.meta?.(account) ?? <AccountCredentialChips account={account} />;
  return (
    <RecordCard selected={selected} onClick={onSelect ? () => onSelect(account) : undefined}>
      <RecordMain>
        <RecordTop>
          <RecordIdentity icon={config.icon?.(account)} title={title} subtitle={subtitle} />
          <StatusBadge status={accountStatus(account)} />
        </RecordTop>
        <RecordMeta>{meta}</RecordMeta>
      </RecordMain>
      {actions.length > 0 && <RecordActions><AccountActionBar account={account} actions={actions} /></RecordActions>}
      {children}
      <span className="sr-only">{accountKey(account)}</span>
    </RecordCard>
  );
}
