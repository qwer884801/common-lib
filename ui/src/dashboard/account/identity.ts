import type { AccountRecord } from './types';

export function accountId(account: AccountRecord) {
  return account.key?.account_id?.trim() || '';
}

export function accountKey(account: AccountRecord) {
  const key = account.key;
  return [key?.source_service, key?.account_type, key?.account_id].filter(Boolean).join(':') || accountId(account);
}

export function accountTitle(account: AccountRecord) {
  return account.display_name || accountSubject(account) || accountId(account) || '-';
}

export function accountSubject(account: AccountRecord) {
  const subject = account.subject;
  if (!subject) return '';
  return subject.display || subject.email || subject.phone_e164 || subject.external_id || '';
}

export function accountSubjectEmail(account: AccountRecord) {
  return (account.subject?.email || '').trim().toLowerCase();
}

export function accountSubjectPhone(account: AccountRecord) {
  return (account.subject?.phone_e164 || '').trim();
}

export function accountSubjectExternalID(account: AccountRecord) {
  return (account.subject?.external_id || '').trim();
}

export function accountSubtitle(account: AccountRecord) {
  const key = account.key;
  const parts = [key?.source_service, key?.account_type, account.provider_key].filter(Boolean);
  return parts.join(' · ');
}

export function accountStatus(account: AccountRecord) {
  return account.status?.label || account.status?.value || '-';
}

export function accountStatusValue(account: AccountRecord) {
  return (account.status?.value || '').trim();
}

export function accountStatusLabel(account: AccountRecord) {
  return (account.status?.label || account.status?.value || '-').trim();
}

export function accountErrorMessage(account: AccountRecord) {
  return (account.status?.error?.message || '').trim();
}

export function accountCreatedAtUnix(account: AccountRecord) {
  return timestampUnix(account.created_at);
}

export function accountUpdatedAtUnix(account: AccountRecord) {
  return timestampUnix(account.updated_at);
}

export function timestampUnix(value?: string) {
  if (!value) return 0;
  const millis = Date.parse(value);
  return Number.isFinite(millis) ? Math.floor(millis / 1000) : 0;
}
