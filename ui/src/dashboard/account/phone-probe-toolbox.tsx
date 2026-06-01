import type { ReactNode } from 'react';
import { AccountPhoneProbeForm, type AccountPhoneResolveResult, type AccountPhoneValues } from './phone-fields';

export type AccountPhoneProbeToolboxProps<TTarget, TResult> = {
  title: ReactNode;
  emptyResultText: ReactNode;
  countryPlaceholder: string;
  phonePlaceholder: string;
  actionLabel: string;
  subject?: string;
  result?: TResult | null;
  busy?: boolean;
  resolve: (values: AccountPhoneValues) => AccountPhoneResolveResult<TTarget>;
  renderResult: (props: AccountPhoneProbeToolboxResultProps<TResult>) => ReactNode;
  onSubmit: (target: TTarget) => void | Promise<void>;
  onError: (message: string) => void;
};

export type AccountPhoneProbeToolboxResultProps<TResult> = {
  subject: string;
  result: TResult | null;
  loading?: boolean;
};

export function AccountPhoneProbeToolbox<TTarget, TResult>({
  title,
  emptyResultText,
  countryPlaceholder,
  phonePlaceholder,
  actionLabel,
  subject,
  result,
  busy,
  resolve,
  renderResult,
  onSubmit,
  onError,
}: AccountPhoneProbeToolboxProps<TTarget, TResult>) {
  const normalizedSubject = subject || '';
  const resultSlot = busy || result || normalizedSubject
    ? renderResult({ subject: normalizedSubject, result: result ?? null, loading: busy })
    : undefined;

  return (
    <div className="p-3">
      <AccountPhoneProbeForm
        title={title}
        disabled={busy}
        resultSlot={resultSlot}
        emptyResultText={emptyResultText}
        countryPlaceholder={countryPlaceholder}
        phonePlaceholder={phonePlaceholder}
        actionLabel={actionLabel}
        resolve={resolve}
        onSubmit={onSubmit}
        onError={onError}
      />
    </div>
  );
}
