import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ContentTabs, type WorkspaceTabDescriptor } from '../layout';
import { DetailDrawer } from '../common/drawer';
import { AccountCarrierList, type AccountCarrierListProps } from './carrier-list';
import { accountRecordFromCarrier, type AccountRecordCarrier } from './carrier';
import { accountId, accountSubject, accountTitle } from './identity';
import { AccountManagementFrame, type AccountManagementFrameProps } from './management-view';
import type { AccountRecord } from './types';

export type AccountManagementDetailTab = WorkspaceTabDescriptor<string>;

export type AccountManagementDrawerViewProps<T extends AccountRecordCarrier> =
  Omit<AccountCarrierListProps<T>, 'selectedID'> &
  Pick<AccountManagementFrameProps, 'title' | 'icon' | 'actions' | 'className' | 'headerControlsClassName' | 'bodyClassName'> & {
    selectedCarrier?: T | null;
    selectedID?: string;
    drawerTitle?: ReactNode | ((carrier: T, account: AccountRecord) => ReactNode);
    drawerDescription?: ReactNode;
    drawerSize?: 'default' | 'wide';
    detailTabs?: (carrier: T, account: AccountRecord) => AccountManagementDetailTab[];
    detail?: (carrier: T, account: AccountRecord) => ReactNode;
    onCloseDetails: () => void;
  };

export function AccountManagementDrawerView<T extends AccountRecordCarrier>({
  title,
  icon,
  actions,
  className,
  headerControlsClassName,
  bodyClassName,
  selectedCarrier,
  selectedID,
  drawerTitle,
  drawerDescription,
  drawerSize = 'wide',
  detailTabs,
  detail,
  onCloseDetails,
  recordOf = (carrier) => accountRecordFromCarrier(carrier),
  listClassName,
  ...listProps
}: AccountManagementDrawerViewProps<T>) {
  const selectedAccount = selectedCarrier ? recordOf(selectedCarrier) || null : null;
  const resolvedSelectedID = selectedID || (selectedAccount ? accountId(selectedAccount) : '');
  return (
    <>
      <AccountManagementFrame
        title={title}
        icon={icon}
        actions={actions}
        className={className}
        headerControlsClassName={headerControlsClassName}
        bodyClassName={bodyClassName}
      >
        <AccountCarrierList
          {...listProps}
          recordOf={recordOf}
          selectedID={resolvedSelectedID}
          listClassName={cn('accountManagementList', listClassName)}
        />
      </AccountManagementFrame>
      {selectedCarrier && selectedAccount && (
        <DetailDrawer
          key={accountId(selectedAccount)}
          open
          title={renderDrawerTitle(drawerTitle, selectedCarrier, selectedAccount)}
          description={drawerDescription}
          icon={icon}
          size={drawerSize}
          onClose={onCloseDetails}
        >
          {renderDetail(selectedCarrier, selectedAccount, detailTabs, detail)}
        </DetailDrawer>
      )}
    </>
  );
}

function renderDetail<T extends AccountRecordCarrier>(
  carrier: T,
  account: AccountRecord,
  detailTabs?: (carrier: T, account: AccountRecord) => AccountManagementDetailTab[],
  detail?: (carrier: T, account: AccountRecord) => ReactNode,
) {
  const tabs = detailTabs?.(carrier, account) || [];
  if (tabs.length > 0) {
    return <ContentTabs tabs={tabs} tabsListVariant="line" tabsClassName="accountDetailsTabs" />;
  }
  return detail?.(carrier, account) || null;
}

function renderDrawerTitle<T extends AccountRecordCarrier>(
  title: AccountManagementDrawerViewProps<T>['drawerTitle'],
  carrier: T,
  account: AccountRecord,
) {
  if (typeof title === 'function') return title(carrier, account);
  return title ?? accountSubject(account) ?? accountTitle(account);
}
