import { api } from '../http';
import { cursorPageURL, type CursorPageResponse } from '../common/cursor-pages';
import { requireOperationSuccess, requireResultAccount, type AccountResultLike, type OperationResultLike } from '../common/result';
import type { AccountCarrierListResponse, AccountRecordCarrier } from './cache';

export type AccountListEndpointOptions = {
  path: string;
  cursor?: string;
  limit?: number;
  params?: Record<string, string | number | boolean | null | undefined>;
};

export type AccountListEndpointResponse<T extends AccountRecordCarrier> =
  AccountCarrierListResponse<T> & CursorPageResponse;

export function accountListEndpointURL(options: AccountListEndpointOptions) {
  return cursorPageURL(options.path, {
    cursor: options.cursor,
    limit: options.limit,
    params: options.params,
  });
}

export function fetchAccountList<T extends AccountRecordCarrier, R extends AccountListEndpointResponse<T> = AccountListEndpointResponse<T>>(
  options: AccountListEndpointOptions,
  init?: RequestInit,
) {
  return api<R>(accountListEndpointURL(options), init);
}

export async function mutateAccount<T extends AccountRecordCarrier, R extends AccountResultLike<T> = AccountResultLike<T>>(
  path: string,
  init?: RequestInit,
) {
  return requireResultAccount(await api<R>(path, init));
}

export async function mutateAccountOperation<R extends OperationResultLike = OperationResultLike>(
  path: string,
  init?: RequestInit,
) {
  return requireOperationSuccess(await api<R>(path, init));
}
