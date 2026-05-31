import { maskEmail } from '../email/email-utils';
import {
  accountCreatedAtUnix,
  accountErrorMessage,
  accountId,
  accountKey,
  accountStatusValue,
  accountSubjectEmail,
  accountSubjectPhone,
  timestampUnix,
  accountUpdatedAtUnix,
} from './identity';
import { accountCredentialState } from './model';
import type { AccountRecord } from './types';

export type AccountIDRecord = {
  account_id?: string;
  id?: string;
};

export type AccountRecordCarrier = AccountIDRecord | AccountRecord | { account?: AccountRecord | null };

export function accountRecordID(record: AccountIDRecord) {
  return (record.account_id || record.id || '').trim();
}

export function accountRecordFromCarrier<T extends AccountRecordCarrier | null | undefined>(carrier: T): AccountRecord | undefined {
  if (!carrier) return undefined;
  if ('account' in carrier) return carrier.account || undefined;
  if ('key' in carrier) return carrier as AccountRecord;
  return undefined;
}

export function requireAccountRecord<T extends AccountRecordCarrier | null | undefined>(carrier: T, message = 'account projection is required') {
  const account = accountRecordFromCarrier(carrier);
  if (!account) throw new Error(message);
  return account;
}

export function accountCarrierID<T extends AccountRecordCarrier | null | undefined>(carrier: T, recordOf: (carrier: NonNullable<T>) => AccountRecord | undefined = accountRecordFromCarrier) {
  if (!carrier) return '';
  const account = recordOf(carrier);
  return account ? accountId(account) : accountRecordID(carrier as AccountIDRecord);
}

export function accountCarrierKey<T extends AccountRecordCarrier | null | undefined>(carrier: T, recordOf: (carrier: NonNullable<T>) => AccountRecord | undefined = accountRecordFromCarrier) {
  if (!carrier) return '';
  const account = recordOf(carrier);
  return account ? accountKey(account) : accountRecordID(carrier as AccountIDRecord);
}

export function accountCarrierMatchesID<T extends AccountRecordCarrier | null | undefined>(carrier: T, value: string, recordOf: (carrier: NonNullable<T>) => AccountRecord | undefined = accountRecordFromCarrier) {
  const id = value.trim();
  return !!id && (accountCarrierID(carrier, recordOf) === id || accountCarrierKey(carrier, recordOf) === id);
}

export function accountCarrierByID<T extends AccountRecordCarrier>(carriers: readonly T[] | undefined | null, value: string, recordOf: (carrier: T) => AccountRecord | undefined = accountRecordFromCarrier) {
  const id = value.trim();
  return id ? (carriers || []).find((carrier) => accountCarrierMatchesID(carrier, id, recordOf)) || null : null;
}

export function accountCarrierEmail<T extends AccountRecordCarrier | null | undefined>(carrier: T) {
  const account = accountRecordFromCarrier(carrier);
  return account ? accountSubjectEmail(account) : '';
}

export function accountCarrierPhone<T extends AccountRecordCarrier | null | undefined>(carrier: T) {
  const account = accountRecordFromCarrier(carrier);
  return account ? accountSubjectPhone(account) : '';
}

export function accountCarrierStatusValue<T extends AccountRecordCarrier | null | undefined>(carrier: T) {
  const account = accountRecordFromCarrier(carrier);
  return account ? accountStatusValue(account) : '';
}

export function accountCarrierErrorMessage<T extends AccountRecordCarrier | null | undefined>(carrier: T) {
  const account = accountRecordFromCarrier(carrier);
  return account ? accountErrorMessage(account) : '';
}

export function accountCarrierCreatedAtUnix<T extends AccountRecordCarrier | null | undefined>(carrier: T) {
  const account = accountRecordFromCarrier(carrier);
  return account ? accountCreatedAtUnix(account) : 0;
}

export function accountCarrierUpdatedAtUnix<T extends AccountRecordCarrier | null | undefined>(carrier: T) {
  const account = accountRecordFromCarrier(carrier);
  return account ? accountUpdatedAtUnix(account) : 0;
}

export function accountCarrierCredentialState<T extends AccountRecordCarrier | null | undefined>(carrier: T, kind: string) {
  return accountCredentialState(accountRecordFromCarrier(carrier), kind);
}

export function accountCarrierCredentialUpdatedAtUnix<T extends AccountRecordCarrier | null | undefined>(carrier: T, kind: string) {
  return timestampUnix(accountCarrierCredentialState(carrier, kind)?.updated_at);
}

export function accountRecordsFromCarriers<T extends AccountRecordCarrier>(carriers: readonly T[] | undefined | null, recordOf: (carrier: T) => AccountRecord | undefined = accountRecordFromCarrier) {
  return (carriers || []).map((carrier) => recordOf(carrier)).filter((account): account is AccountRecord => Boolean(account));
}

export function accountCarrierMap<T extends AccountRecordCarrier>(carriers: readonly T[] | undefined | null, recordOf: (carrier: T) => AccountRecord | undefined = accountRecordFromCarrier) {
  const entries: Array<[string, T]> = [];
  for (const carrier of carriers || []) {
    const key = accountCarrierKey(carrier, recordOf);
    if (key) entries.push([key, carrier]);
  }
  return new Map(entries);
}

export function maskAccountRecordEmail(record: AccountRecord, email = accountSubjectEmail(record)): AccountRecord {
  const display = maskEmail(email || record.display_name);
  return {
    ...record,
    display_name: display,
    subject: record.subject ? { ...record.subject, email: display, display } : record.subject,
  };
}
