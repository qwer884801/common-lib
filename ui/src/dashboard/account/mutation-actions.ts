import { useCallback } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import type { AsyncActionHooks, AsyncActionResult } from '../common/action-runner';
import { useAccountActionRunner, type AccountActionTarget } from './action-runner';
import { useAccountCacheActions } from './cache-actions';
import type { AccountCarrierListResponse, AccountRecordCarrier } from './cache';
import { deleteAccountCarrier, type DeleteAccountCarrierOptions } from './delete-actions';
import type { AccountRecord } from './types';

export type AccountMutationActionsOptions<
  T extends AccountRecordCarrier,
  R extends AccountCarrierListResponse<T>,
> = {
  listQueryKey: QueryKey;
  invalidateQueryKeys?: Iterable<QueryKey>;
  recordOf?: (record: T) => AccountRecord | undefined;
  setSelectedID?: DeleteAccountCarrierOptions<T>['setSelectedID'];
};

export type AccountMutationOptions<T> = AsyncActionHooks<T | null | undefined> & {
  cache?: boolean;
  invalidate?: boolean;
};

export type AccountDeleteOptions<T extends AccountRecordCarrier> = AsyncActionHooks<boolean> & {
  actionID?: string;
  confirmMessage?: DeleteAccountCarrierOptions<T>['confirmMessage'];
  invalidate?: boolean;
};

export function useAccountMutationActions<
  T extends AccountRecordCarrier,
  R extends AccountCarrierListResponse<T>,
>(options: AccountMutationActionsOptions<T, R>) {
  const cache = useAccountCacheActions<T, R>(options);
  const runner = useAccountActionRunner();

  const runAccountMutation = useCallback(async (
    actionID: string,
    target: AccountActionTarget,
    mutation: () => Promise<T | null | undefined>,
    hooks: AccountMutationOptions<T> = {},
  ) => runner.runAccountAction(actionID, target, async () => {
    const account = await mutation();
    if (account && hooks.cache !== false) cache.upsertAccount(account);
    return account;
  }, {
    onSuccess: async (account) => {
      await hooks.onSuccess?.(account);
      if (hooks.invalidate !== false) await cache.invalidate();
    },
    onError: hooks.onError,
    onSettled: hooks.onSettled,
  }), [cache, runner]);

  const tryRunAccountMutation = useCallback(async (
    actionID: string,
    target: AccountActionTarget,
    mutation: () => Promise<T | null | undefined>,
    hooks: AccountMutationOptions<T> = {},
  ): Promise<AsyncActionResult<T | null | undefined>> => {
    try {
      return { ok: true, value: await runAccountMutation(actionID, target, mutation, hooks) };
    } catch (error) {
      return { ok: false, error };
    }
  }, [runAccountMutation]);

  const deleteAccount = useCallback((
    carrier: T,
    deleteByID: DeleteAccountCarrierOptions<T>['deleteByID'],
    deleteOptions: AccountDeleteOptions<T> = {},
  ) => runner.runAccountAction(deleteOptions.actionID || 'delete-account', carrier, () => (
    deleteAccountCarrier(carrier, {
      deleteByID,
      setSelectedID: options.setSelectedID,
      confirmMessage: deleteOptions.confirmMessage,
      invalidate: deleteOptions.invalidate === false ? undefined : cache.invalidate,
    })
  ), deleteOptions), [cache.invalidate, options.setSelectedID, runner]);

  return {
    ...runner,
    invalidate: cache.invalidate,
    cacheAccount: cache.upsertAccount,
    removeCachedAccount: cache.removeAccount,
    runAccountMutation,
    tryRunAccountMutation,
    deleteAccount,
  };
}
