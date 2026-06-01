import type { AccountCarrierCollectionOptions } from './collection';
import { useAccountCarrierCollection } from './collection';
import type { AccountCarrierPageResponse, AccountRecordCarrier } from './cache';
import { useAccountMutationActions } from './mutation-actions';

export type AccountManagementControllerOptions<
  T extends AccountRecordCarrier,
  R extends AccountCarrierPageResponse<T>,
> = AccountCarrierCollectionOptions<T, R>;

export type AccountManagementController<
  T extends AccountRecordCarrier,
  R extends AccountCarrierPageResponse<T>,
> = ReturnType<typeof useAccountManagementController<T, R>>;

export function useAccountManagementController<
  T extends AccountRecordCarrier,
  R extends AccountCarrierPageResponse<T>,
>(options: AccountManagementControllerOptions<T, R>) {
  const collection = useAccountCarrierCollection<T, R>(options);
  const mutations = useAccountMutationActions<T, R>({
    listQueryKey: options.queryKey,
    invalidateQueryKeys: options.invalidateQueryKeys,
    recordOf: options.recordOf,
    setSelectedID: collection.setSelectedID,
  });
  return {
    ...collection,
    ...mutations,
    actionBusy: mutations.busy,
    accountsPagination: collection.pagination,
  };
}
