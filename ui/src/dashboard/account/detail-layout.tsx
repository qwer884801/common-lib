import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ActionButtonGroup, ActionSection, type ActionButtonDescriptor } from '../common/actions';
import { ContentTabs, type ContentTabsProps, type WorkspaceTabDescriptor } from '../layout';
import { AccountActionRow, AccountActionRows, hasVisibleAction } from './action-rows';
import { accountDeleteButtonAction } from './delete-actions';

export type AccountDetailTab<TValue extends string = string> = WorkspaceTabDescriptor<TValue>;

export function AccountDetailTabs<TValue extends string = string>({
  tabs,
  tabsClassName,
  tabsListVariant = 'line',
  ...props
}: ContentTabsProps<TValue>) {
  return <ContentTabs {...props} tabs={tabs.map(accountDetailTab)} tabsListVariant={tabsListVariant} tabsClassName={cn('accountDetailsTabs', tabsClassName)} />;
}

export function accountDetailTab<TValue extends string>(tab: AccountDetailTab<TValue>): AccountDetailTab<TValue> {
  return { ...tab, contentClassName: cn('accountDetailTabContent', tab.contentClassName) };
}

export function AccountDetailActionSection({ title, description, actions, className, contentClassName, buttonGroupClassName = 'sectionActions' }: {
  title: ReactNode;
  description?: ReactNode;
  actions: ActionButtonDescriptor[];
  className?: string;
  contentClassName?: string;
  buttonGroupClassName?: string;
}) {
  if (!hasVisibleAction(actions)) return null;
  return (
    <ActionSection title={title} description={description} className={className} contentClassName={contentClassName}>
      <ActionButtonGroup actions={actions} className={buttonGroupClassName} />
    </ActionSection>
  );
}

export function AccountDangerZone<TAccount>({ account, busy, onDelete, className = 'bottomActionRows', label = '危险', deleteLabel = '删除账号' }: {
  account: TAccount;
  busy?: boolean;
  onDelete: (account: TAccount) => void | Promise<void>;
  className?: string;
  label?: ReactNode;
  deleteLabel?: string;
}) {
  return (
    <AccountActionRows className={className}>
      <AccountActionRow label={label} actions={[accountDeleteButtonAction(() => onDelete(account), Boolean(busy), deleteLabel)]} />
    </AccountActionRows>
  );
}
