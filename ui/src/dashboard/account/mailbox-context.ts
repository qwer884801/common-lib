import { canonicalUiEmail, maskEmail, normalizeUiEmail } from '../email/email-utils';
import { accountCarrierEmail } from './carrier';
import type { AccountRecordCarrier } from './carrier';

export type AccountMailboxContext = {
  account_email: string;
  primary_email: string;
  provider_key: string;
  is_split: boolean;
  known: boolean;
};

export type AccountMailboxContextLike = Partial<Pick<AccountMailboxContext, 'primary_email' | 'is_split' | 'known'>> | null | undefined;

export type AccountEmailLike = AccountRecordCarrier & {
  email?: string;
  primary_mailbox_email?: string;
};

export type AccountMailboxLike = {
  email_address?: string;
  provider_key?: string;
};

export type AccountEmailAllocationLike = {
  email?: string;
  primary_email?: string;
  status?: string;
  is_primary?: boolean;
  splittable?: boolean;
};

export function accountMailboxContextForEmail(
  mailboxes: AccountMailboxLike[],
  allocations: AccountEmailAllocationLike[],
  account: AccountEmailLike,
): AccountMailboxContext {
  const accountEmail = accountMailboxEmail(account);
  const allocation = accountAllocationForEmail(allocations, accountEmail);
  const primaryEmail = normalizeUiEmail(
    account.primary_mailbox_email ||
      allocation?.primary_email ||
      canonicalUiEmail(accountEmail),
  );
  const mailbox = mailboxes.find((item) => [accountEmail, primaryEmail].includes(normalizeUiEmail(item.email_address || '')));
  return {
    account_email: accountEmail,
    primary_email: primaryEmail,
    provider_key: mailbox?.provider_key || '',
    is_split: !!accountEmail && !!primaryEmail && accountEmail !== primaryEmail,
    known: !!mailbox || !!allocation,
  };
}

export function accountAllocationForEmail<T extends AccountEmailAllocationLike>(allocations: T[], email: string) {
  const target = normalizeUiEmail(email);
  if (!target) return undefined;
  return allocations.find((allocation) => normalizeUiEmail(allocation.email || '') === target);
}

export function countAllocatableAccountMailboxAllocations(allocations: AccountEmailAllocationLike[]) {
  return allocations.filter(
    (allocation) =>
      allocation.status === 'AVAILABLE' ||
      (allocation.is_primary && allocation.status === 'REGISTERED' && allocation.splittable),
  ).length;
}

export function accountMailboxInboxHint(email: string, context: AccountMailboxContextLike, showSecrets: boolean) {
  const accountEmail = showSecrets ? email : maskEmail(email);
  if (!context?.is_split) return `重新读取当前账号邮箱 ${accountEmail} 的 OTP 缓存`;
  const primaryEmail = showSecrets ? context.primary_email || '' : maskEmail(context.primary_email || '');
  return `重新读取邮箱账号 ${primaryEmail} 的 OTP 缓存，按收件地址 ${accountEmail} 匹配`;
}

export function accountMailboxInboxHintForAccount(account: AccountEmailLike, context: AccountMailboxContextLike, showSecrets: boolean) {
  return accountMailboxInboxHint(accountMailboxEmail(account), context, showSecrets);
}

export function canFetchAccountMailboxInbox(account: AccountEmailLike, context: AccountMailboxContextLike) {
  return !!accountMailboxEmail(account) && !!context?.known;
}

function accountMailboxEmail(account: AccountEmailLike) {
  return normalizeUiEmail(accountCarrierEmail(account) || account.email || '');
}
