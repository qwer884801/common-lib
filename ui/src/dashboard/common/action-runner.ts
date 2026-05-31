import { useCallback, useMemo, useState } from 'react';

export type AsyncActionResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: unknown };

export type AsyncActionHooks<T> = {
  onSuccess?: (value: T) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
  onSettled?: () => void | Promise<void>;
};

export function actionStateKey(...parts: unknown[]) {
  return parts.map(actionKeyPart).filter(Boolean).join(':');
}

export function actionTargetStateKey(actionID: string, target?: unknown) {
  return actionStateKey(actionID, target);
}

export function activeActionTarget(activeKey: string, actionID: string) {
  const prefix = actionStateKey(actionID);
  const key = actionStateKey(activeKey);
  if (!prefix || !key || key === prefix) return '';
  return key.startsWith(`${prefix}:`) ? key.slice(prefix.length + 1) : '';
}

export function activeActionTargets(activeKeys: Iterable<string>, actionID: string) {
  return Array.from(activeKeys, (key) => activeActionTarget(key, actionID)).filter(Boolean);
}

export function hasActiveAction(activeKeys: Iterable<string>, actionID: string) {
  const prefix = actionStateKey(actionID);
  if (!prefix) return false;
  for (const key of activeKeys) {
    const normalized = actionStateKey(key);
    if (normalized === prefix || normalized.startsWith(`${prefix}:`)) return true;
  }
  return false;
}

export function useAsyncActionRunner(initialKeys: Iterable<string> = []) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => new Set(Array.from(initialKeys, (key) => actionStateKey(key)).filter(Boolean)));
  const keys = useMemo(() => new Set(activeKeys), [activeKeys]);
  const activeKey = useMemo(() => Array.from(activeKeys)[0] || '', [activeKeys]);

  const start = useCallback((key: string) => {
    setActiveKeys((prev) => setKeyActive(prev, key, true));
  }, []);

  const finish = useCallback((key: string) => {
    setActiveKeys((prev) => setKeyActive(prev, key, false));
  }, []);

  const clear = useCallback((key?: string) => {
    setActiveKeys((prev) => {
      if (!key) return prev.size ? new Set<string>() : prev;
      return setKeyActive(prev, key, false);
    });
  }, []);

  const isActive = useCallback((key?: string) => {
    if (!key) return activeKeys.size > 0;
    return activeKeys.has(actionStateKey(key));
  }, [activeKeys]);

  const run = useCallback(async <T,>(key: string, action: () => T | Promise<T>, hooks: AsyncActionHooks<T> = {}) => {
    const normalized = actionStateKey(key);
    if (normalized) start(normalized);
    try {
      const value = await action();
      await hooks.onSuccess?.(value);
      return value;
    } catch (error) {
      await hooks.onError?.(error);
      throw error;
    } finally {
      if (normalized) finish(normalized);
      await hooks.onSettled?.();
    }
  }, [finish, start]);

  const tryRun = useCallback(async <T,>(key: string, action: () => T | Promise<T>, hooks: AsyncActionHooks<T> = {}): Promise<AsyncActionResult<T>> => {
    try {
      return { ok: true, value: await run(key, action, hooks) };
    } catch (error) {
      return { ok: false, error };
    }
  }, [run]);

  return {
    activeKeys: keys as ReadonlySet<string>,
    activeKey,
    busy: activeKeys.size > 0,
    isActive,
    start,
    finish,
    clear,
    run,
    tryRun,
  };
}

function actionKeyPart(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function setKeyActive(prev: Set<string>, key: string, active: boolean) {
  const normalized = actionStateKey(key);
  if (!normalized || prev.has(normalized) === active) return prev;
  const next = new Set(prev);
  if (active) next.add(normalized);
  else next.delete(normalized);
  return next;
}
