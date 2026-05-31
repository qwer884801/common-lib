import type { AccountCredentialState, AccountError, AccountStatus, AccountSubject } from '../../proto/byte/v/forge/contracts/account/v1/account';
import type { AccountRecord } from './types';

export const ACCOUNT_CREDENTIAL_KIND_MAILBOX = 'mailbox';
export const ACCOUNT_CREDENTIAL_KIND_PIN = 'pin';
export const ACCOUNT_CREDENTIAL_KIND_TOKEN = 'token';
export const ACCOUNT_CREDENTIAL_KIND_ACCESS_TOKEN = 'access_token';
export const ACCOUNT_CREDENTIAL_KIND_SESSION_TOKEN = 'session_token';

export const ACCOUNT_CREDENTIAL_STATUS_CONFIGURED = 'configured';
export const ACCOUNT_CREDENTIAL_STATUS_FETCHED = 'fetched';
export const ACCOUNT_CREDENTIAL_STATUS_MESSAGE_SEEN = 'message_seen';

export type AccountRecordInit = {
  source_service: string;
  account_type: string;
  account_id: string;
  provider_key?: string;
  display_name?: string;
  subject?: AccountSubject;
  status?: AccountStatus;
  credential_states?: AccountCredentialState[];
  created_at_unix?: number;
  updated_at_unix?: number;
};

export function accountRecord(init: AccountRecordInit): AccountRecord {
  return {
    key: {
      source_service: init.source_service.trim(),
      account_type: init.account_type.trim(),
      account_id: init.account_id.trim()
    },
    provider_key: init.provider_key?.trim() || '',
    display_name: init.display_name?.trim() || '',
    subject: init.subject,
    status: init.status,
    credential_states: init.credential_states || [],
    created_at: accountUnixTimestamp(init.created_at_unix),
    updated_at: accountUnixTimestamp(init.updated_at_unix)
  };
}

export function accountEmailSubject(email: string, display = email): AccountSubject {
  return { email: email.trim(), display: display.trim() };
}

export function accountPhoneSubject(phone_e164: string, display = phone_e164): AccountSubject {
  return { phone_e164: phone_e164.trim(), display: display.trim() };
}

export function accountExternalSubject(external_id: string, display = external_id): AccountSubject {
  return { external_id: external_id.trim(), display: display.trim() };
}

function accountStatusValue(value: string, label = value, error?: AccountError): AccountStatus {
  return { value: value.trim(), label: label.trim(), error };
}

export function accountStatusWithError(value: string, code: string, message?: string, retryable = false, label = value): AccountStatus {
  const text = message?.trim() || '';
  return accountStatusValue(value, label, text ? { code: code.trim(), message: text, retryable } : undefined);
}

export function accountCredential(kind: string, present: boolean, status = '', expiresAtUnix = 0, updatedAtUnix = 0): AccountCredentialState {
  return {
    kind: kind.trim(),
    present,
    status: status.trim(),
    expires_at: accountUnixTimestamp(expiresAtUnix),
    updated_at: accountUnixTimestamp(updatedAtUnix)
  };
}

export function accountCredentialState(account: Pick<AccountRecord, 'credential_states'> | undefined, kind: string): AccountCredentialState | undefined {
  const normalized = kind.trim();
  if (!normalized) return undefined;
  return (account?.credential_states || []).find((credential) => credential.kind.trim() === normalized);
}

export function accountUnixTimestamp(value?: number): string | undefined {
  if (!value || value <= 0) return undefined;
  return new Date(value * 1000).toISOString();
}
