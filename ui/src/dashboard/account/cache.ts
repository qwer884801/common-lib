import { type InfiniteData, type QueryClient, type QueryKey } from '@tanstack/react-query';
import { DEFAULT_CURSOR_PAGE_SIZE, cursorPageItems, cursorPageNextCursor, responseList, useCursorPageItems, type CursorPageResponse } from '../common/cursor-pages';
import {
  accountCarrierKey,
  accountCarrierMatchesID,
  accountRecordID,
  accountRecordFromCarrier,
  accountRecordsFromCarriers,
  type AccountIDRecord,
  type AccountRecordCarrier,
} from './carrier';
import type { AccountRecord } from './types';

export const ACCOUNT_PAGE_SIZE = DEFAULT_CURSOR_PAGE_SIZE;
export {
  accountCarrierID,
  accountCarrierKey,
  accountCarrierMap,
  accountRecordFromCarrier,
  accountRecordID,
  accountRecordsFromCarriers,
} from './carrier';
export type { AccountIDRecord, AccountRecordCarrier } from './carrier';

export type AccountCarrierListResponse<T extends AccountRecordCarrier> = {
  accounts?: T[] | null;
};

export type AccountCarrierPageResponse<T extends AccountRecordCarrier> = AccountCarrierListResponse<T> & CursorPageResponse;

export type AccountPagesOptions<T extends AccountRecordCarrier, R extends AccountCarrierPageResponse<T>> = {
  queryKey: QueryKey;
  queryFn: (cursor: string) => Promise<R>;
  enabled?: boolean;
  refetchInterval?: number | false;
  pageSize?: number;
  initialCursor?: string;
};

export function accountQueryPrefix(scope: string, name: string) {
  return [scope.trim(), name.trim()] as const;
}

export function accountQueryKey(prefix: QueryKey, ...parts: unknown[]): QueryKey {
  return [...prefix, ...parts.filter((part) => part !== undefined && part !== null)];
}

export async function invalidateAccountQueryKeys(queryClient: QueryClient, queryKeys: Iterable<QueryKey>) {
  await Promise.all(Array.from(queryKeys, (queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function accountListCarriers<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(response: R | null | undefined) {
  return responseList<T, R, 'accounts'>(response, 'accounts');
}

export function accountListRecords<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(response: R | null | undefined, recordOf: (carrier: T) => AccountRecord | undefined = accountRecordFromCarrier) {
  return accountRecordsFromCarriers(accountListCarriers<T, R>(response), recordOf);
}

export function accountPagesCarriers<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(pages: readonly (R | null | undefined)[] | undefined | null) {
  return cursorPageItems<T, R, 'accounts'>(pages, 'accounts');
}

export function accountPageNextCursor<T extends AccountRecordCarrier, R extends AccountCarrierPageResponse<T>>(response: R | null | undefined) {
  return cursorPageNextCursor(response);
}

export function useAccountPages<T extends AccountRecordCarrier, R extends AccountCarrierPageResponse<T>>(options: AccountPagesOptions<T, R>) {
  const query = useCursorPageItems<T, R, 'accounts'>({ ...options, field: 'accounts', pageSize: options.pageSize ?? ACCOUNT_PAGE_SIZE });
  return {
    ...query,
    accounts: query.items,
  };
}

export function upsertAccountCarrierPages<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(
  data: InfiniteData<R> | undefined,
  updated: T,
  recordOf?: (record: T) => AccountRecord | undefined,
): InfiniteData<R> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => upsertAccountListCarrierResponse<T, R>(page, updated, recordOf)),
  };
}

export function removeAccountCarrierPages<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(
  data: InfiniteData<R> | undefined,
  removed: T | string,
  recordOf?: (record: T) => AccountRecord | undefined,
): InfiniteData<R> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => removeAccountListCarrierResponse<T, R>(page, removed, recordOf)),
  };
}

export function upsertAccountRecord<T extends AccountIDRecord>(records: T[], updated: T, idOf: (record: T) => string = (record) => accountRecordID(record)) {
  const updatedID = idOf(updated);
  if (!updatedID) return records;
  const found = records.some((record) => idOf(record) === updatedID);
  return found ? records.map((record) => (idOf(record) === updatedID ? updated : record)) : [updated, ...records];
}

export function upsertAccountListResponse<T extends AccountIDRecord, R extends object, K extends keyof R>(
  response: R | undefined,
  field: K,
  updated: T,
  idOf?: (record: T) => string,
): R {
  return {
    ...((response || {}) as R),
    [field]: upsertAccountRecord(responseList<T, R, K>(response, field), updated, idOf),
  } as R;
}

export function upsertAccountCarrierListResponse<T extends AccountRecordCarrier, R extends object, K extends keyof R>(
  response: R | undefined,
  field: K,
  updated: T,
  recordOf?: (record: T) => AccountRecord | undefined,
): R {
  const idOf = (record: T) => accountCarrierKey(record, recordOf);
  const records = responseList<T, R, K>(response, field);
  return {
    ...((response || {}) as R),
    [field]: upsertAccountRecord(records as Array<T & AccountIDRecord>, updated as T & AccountIDRecord, idOf as (record: T & AccountIDRecord) => string),
  } as R;
}

export function upsertAccountListCarrierResponse<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(
  response: R | undefined,
  updated: T,
  recordOf?: (record: T) => AccountRecord | undefined,
): R {
  return upsertAccountCarrierListResponse(response, 'accounts', updated, recordOf);
}

export function removeAccountCarrierListResponse<T extends AccountRecordCarrier, R extends object, K extends keyof R>(
  response: R | undefined,
  field: K,
  removed: T | string,
  recordOf?: (record: T) => AccountRecord | undefined,
): R {
  const removedID = typeof removed === 'string' ? removed.trim() : accountCarrierKey(removed, recordOf);
  const records = responseList<T, R, K>(response, field);
  return {
    ...((response || {}) as R),
    [field]: removedID ? records.filter((record) => !accountCarrierMatchesID(record, removedID, recordOf)) : records,
  } as R;
}

export function removeAccountListCarrierResponse<T extends AccountRecordCarrier, R extends AccountCarrierListResponse<T>>(
  response: R | undefined,
  removed: T | string,
  recordOf?: (record: T) => AccountRecord | undefined,
): R {
  return removeAccountCarrierListResponse(response, 'accounts', removed, recordOf);
}
