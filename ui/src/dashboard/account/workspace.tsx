import type { ReactNode } from 'react';
import { WorkspacePanel } from '../layout';
import { AccountDetails } from './details';
import { AccountList } from './list';
import type { AccountRecord, AccountRenderConfig } from './types';

export function AccountWorkspace({ accounts, selectedKey, selected, onSelect, config, emptyText, toolbar }: {
  accounts: AccountRecord[];
  selectedKey?: string;
  selected?: AccountRecord | null;
  onSelect?: (account: AccountRecord) => void;
  config?: AccountRenderConfig;
  emptyText?: string;
  toolbar?: ReactNode;
}) {
  return (
    <WorkspacePanel workspaceClassName="grid min-h-0 grid-cols-[minmax(280px,360px)_minmax(0,1fr)]" panelClassName="contents">
      <div className="min-h-0 border-r border-border/70">
        {toolbar}
        <AccountList accounts={accounts} selectedKey={selectedKey} onSelect={onSelect} config={config} emptyText={emptyText} />
      </div>
      <div className="min-h-0 overflow-auto">
        <AccountDetails account={selected} config={config} />
      </div>
    </WorkspacePanel>
  );
}
