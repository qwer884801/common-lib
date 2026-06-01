import { useCallback } from 'react';
import type { AccountActionCatalogLike } from './action-catalog';
import { useAccountActionRunner } from './action-runner';
import type { AccountRecordCarrier } from './carrier';
import {
  submitAccountWorkflowAction,
  type AccountWorkflowSubmitResponse,
  type AccountWorkflowSubmitToast,
} from './workflow-submit';

export type AccountWorkflowActionInput<TAccount extends AccountRecordCarrier> = {
  actionID: string;
  account: TAccount;
  payload?: Record<string, unknown>;
  placement?: string;
  fallbackLabel?: string;
};

export type AccountWorkflowActionRunnerOptions<
  TAccount extends AccountRecordCarrier,
  TCatalog extends AccountActionCatalogLike = AccountActionCatalogLike,
> = {
  catalog?: TCatalog;
  pathPrefix?: string;
  actionKeyPrefix?: string;
  toast?: AccountWorkflowSubmitToast;
  onSuccess?: (input: AccountWorkflowActionInput<TAccount>, response: AccountWorkflowSubmitResponse) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

export function useAccountWorkflowActionRunner<
  TAccount extends AccountRecordCarrier,
  TCatalog extends AccountActionCatalogLike = AccountActionCatalogLike,
>(options: AccountWorkflowActionRunnerOptions<TAccount, TCatalog>) {
  const runner = useAccountActionRunner();
  const runWorkflowAction = useCallback(async (input: AccountWorkflowActionInput<TAccount>) => {
    const result = await runner.tryRunAccountAction(
      `${options.actionKeyPrefix || 'workflow'}:${input.actionID}`,
      input.account,
      () => submitAccountWorkflowAction({
        catalog: options.catalog,
        actionID: input.actionID,
        fallbackLabel: input.fallbackLabel,
        placement: input.placement,
        pathPrefix: options.pathPrefix,
        payload: input.payload,
        toast: options.toast,
        onSuccess: (response) => options.onSuccess?.(input, response),
      }),
      { onError: options.onError },
    );
    return result.ok && !result.value.error_message;
  }, [options, runner]);

  return {
    ...runner,
    runWorkflowAction,
  };
}
