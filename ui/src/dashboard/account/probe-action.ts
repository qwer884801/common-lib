import { useCallback, useState } from 'react';
import { useAsyncActionRunner } from '../common/action-runner';

export type AccountProbeActionOptions<TTarget, TResult> = {
  actionKey: string;
  subjectOf: (target: TTarget) => string;
  probe: (target: TTarget) => TResult | Promise<TResult>;
  onSuccess?: (result: TResult, target: TTarget) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

export function useAccountProbeAction<TTarget, TResult>(options: AccountProbeActionOptions<TTarget, TResult>) {
  const [subject, setSubject] = useState('');
  const [result, setResult] = useState<TResult | null>(null);
  const runner = useAsyncActionRunner();

  const run = useCallback(async (target: TTarget) => {
    setSubject(options.subjectOf(target));
    setResult(null);
    await runner.tryRun(options.actionKey, async () => {
      const output = await options.probe(target);
      setResult(output);
      await options.onSuccess?.(output, target);
    }, { onError: options.onError });
  }, [options, runner]);

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return {
    subject,
    result,
    busy: runner.busy,
    run,
    reset,
  };
}
