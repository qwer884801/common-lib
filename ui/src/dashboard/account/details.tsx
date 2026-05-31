import type { ReactNode } from 'react';
import { PanelHeader } from '../common/panels';
import { RecordField } from '../common/records';
import { AccountCredentialChips } from './credentials';
import { accountId, accountStatus, accountSubject, accountTitle } from './identity';
import type { AccountRecord, AccountRenderConfig, AccountSection } from './types';

export function AccountDetails({ account, config = {}, icon }: {
  account?: AccountRecord | null;
  config?: AccountRenderConfig;
  icon?: ReactNode;
}) {
  if (!account) return null;
  const sections = config.sections?.(account) || defaultSections(account);
  const title = config.title?.(account) ?? accountTitle(account);
  const headerIcon = icon ?? config.icon?.(account) ?? <span />;
  const meta = config.meta?.(account);
  return (
    <div className="grid gap-4 p-4">
      <PanelHeader title={title} icon={headerIcon}>{meta}</PanelHeader>
      <AccountCredentialChips account={account} />
      {sections.map((section) => (
        <section key={section.id} className="grid gap-2">
          <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
          <div className="grid gap-2">
            {section.fields.map((field) => (
              <RecordField key={field.label} label={field.label} value={field.value} mono={field.mono} title={field.title} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function defaultSections(account: AccountRecord): AccountSection[] {
  return [{
    id: 'account',
    title: 'Account',
    fields: [
      { label: 'ID', value: accountId(account), mono: true },
      { label: 'Subject', value: accountSubject(account) || '-' },
      { label: 'Status', value: accountStatus(account) },
      { label: 'Provider', value: account.provider_key || '-' },
    ],
  }];
}
