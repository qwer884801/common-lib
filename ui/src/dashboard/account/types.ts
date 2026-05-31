import type { ReactNode } from 'react';
import type { Account, AccountActionDescriptor } from '../../proto/byte/v/forge/contracts/account/v1/account';

export type AccountRecord = Account;

export type AccountAction = AccountActionDescriptor & {
  icon?: ReactNode;
  visible?: boolean;
  onRun?: (account: AccountRecord) => void | Promise<void>;
};

export type AccountField = {
  label: string;
  value?: ReactNode;
  mono?: boolean;
  title?: string;
};

export type AccountSection = {
  id: string;
  title: ReactNode;
  fields: AccountField[];
};

export type AccountRenderConfig = {
  icon?: (account: AccountRecord) => ReactNode;
  title?: (account: AccountRecord) => ReactNode;
  subtitle?: (account: AccountRecord) => ReactNode;
  meta?: (account: AccountRecord) => ReactNode;
  sections?: (account: AccountRecord) => AccountSection[];
  actions?: (account: AccountRecord) => AccountAction[];
};
