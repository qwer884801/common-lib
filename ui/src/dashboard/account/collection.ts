import type { QueryKey } from '@tanstack/react-query';
import { accountRecordFromCarrier, type AccountRecordCarrier } from './carrier';
import { useAccountCacheActions } from './cache-actions';
import { useAccountPages, type AccountCarrierPageResponse, type AccountPagesOptions } from './cache';
import { useAccountSelection, type AccountSelectionOptions } from './selection';
import type { AccountRecord } from './types';

export type AccountCarrierCollectionOptions<
  T extends AccountRecordCarrier,
  R extends AccountCarrierPageResponse<T>,
> = AccountPagesOptions<T, R> & Pick<AccountSelectionOptions<T>, 'selectedID' | 'setSelectedID' | 'initialSelectedID' | 'autoSelectFirst' | 'clearMissingSelection'> & {
  invalidateQueryKeys?: Iterable<QueryKey>;
  recordOf?: (carrier: T) => AccountRecord | undefined;
};

export function useAccountCarrierCollection<
  T extends AccountRecordCarrier,
  R extends AccountCarrierPageResponse<T>,
>(options: AccountCarrierCollectionOptions<T, R>) {
  const pages = useAccountPages<T, R>(options);
  const recordOf = options.recordOf ?? accountRecordFromCarrier;
  const cache = useAccountCacheActions<T, R>({
    listQueryKey: options.queryKey,
    invalidateQueryKeys: options.invalidateQueryKeys,
    recordOf,
  });
  const selection = useAccountSelection(pages.accounts, {
    selectedID: options.selectedID,
    setSelectedID: options.setSelectedID,
    initialSelectedID: options.initialSelectedID,
    recordOf,
    autoSelectFirst: options.autoSelectFirst,
    clearMissingSelection: options.clearMissingSelection,
    enabled: options.enabled,
  });
  return {
    ...pages,
    ...selection,
    invalidate: cache.invalidate,
    cacheAccount: cache.upsertAccount,
    removeCachedAccount: cache.removeAccount,
    hasMoreAccounts: pages.pagination.hasNext,
    loadingMoreAccounts: pages.pagination.loading,
    loadMoreAccounts: pages.loadMore,
  };
}
