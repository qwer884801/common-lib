import { useQueryClient, type InfiniteData, type QueryKey } from '@tanstack/react-query';
import {
  invalidateAccountQueryKeys,
  removeAccountCarrierPages,
  upsertAccountCarrierPages,
  type AccountCarrierListResponse,
  type AccountRecordCarrier,
} from './cache';
import type { AccountRecord } from './types';

export type AccountCacheActionsOptions<
  T extends AccountRecordCarrier,
  R extends AccountCarrierListResponse<T>,
> = {
  listQueryKey: QueryKey;
  invalidateQueryKeys?: Iterable<QueryKey>;
  recordOf?: (record: T) => AccountRecord | undefined;
};

export function useAccountCacheActions<
  T extends AccountRecordCarrier,
  R extends AccountCarrierListResponse<T>,
>(options: AccountCacheActionsOptions<T, R>) {
  const queryClient = useQueryClient();
  const invalidateQueryKeys = options.invalidateQueryKeys ?? [options.listQueryKey];
  return {
    invalidate: () => invalidateAccountQueryKeys(queryClient, invalidateQueryKeys),
    upsertAccount: (account: T) => {
      queryClient.setQueryData<InfiniteData<R>>(options.listQueryKey, (prev) =>
        upsertAccountCarrierPages<T, R>(prev, account, options.recordOf),
      );
    },
    removeAccount: (account: T | string) => {
      queryClient.setQueryData<InfiniteData<R>>(options.listQueryKey, (prev) =>
        removeAccountCarrierPages<T, R>(prev, account, options.recordOf),
      );
    },
  };
}
