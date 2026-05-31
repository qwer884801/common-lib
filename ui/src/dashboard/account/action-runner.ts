import { useCallback } from 'react';
import { actionStateKey, useAsyncActionRunner, type AsyncActionHooks } from '../common/action-runner';
import { accountCarrierID, type AccountRecordCarrier } from './carrier';

export type AccountActionTarget = AccountRecordCarrier | string | null | undefined;

export function accountActionStateKey(actionID: string, target?: AccountActionTarget) {
  return actionStateKey(actionID, accountActionTargetID(target));
}

export function useAccountActionRunner(initialKeys: Iterable<string> = []) {
  const runner = useAsyncActionRunner(initialKeys);
  const { isActive, run, tryRun } = runner;

  const isAccountActionActive = useCallback((actionID: string, target?: AccountActionTarget) => (
    isActive(accountActionStateKey(actionID, target))
  ), [isActive]);

  const runAccountAction = useCallback(<T,>(actionID: string, target: AccountActionTarget, action: () => T | Promise<T>, hooks?: AsyncActionHooks<T>) => (
    run(accountActionStateKey(actionID, target), action, hooks)
  ), [run]);

  const tryRunAccountAction = useCallback(<T,>(actionID: string, target: AccountActionTarget, action: () => T | Promise<T>, hooks?: AsyncActionHooks<T>) => (
    tryRun(accountActionStateKey(actionID, target), action, hooks)
  ), [tryRun]);

  return {
    ...runner,
    isAccountActionActive,
    runAccountAction,
    tryRunAccountAction,
  };
}

function accountActionTargetID(target: AccountActionTarget) {
  if (!target) return '';
  return typeof target === 'string' ? target.trim() : accountCarrierID(target);
}
