import type { ComponentProps, ReactNode } from 'react';
import { Send } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { OneTimeOTPSubmit } from '../common/one-time-otp-submit';
import { accountCarrierID, type AccountRecordCarrier } from './carrier';

export function AccountManualOTPSubmit({
  submitKey,
  subtitle = '只把本次输入提交给当前等待中的流程，不写入 OTP 历史。',
  disabled,
  inputLabel = 'OTP',
  input,
  onSubmit,
  onError,
}: {
  submitKey: string;
  subtitle?: ReactNode;
  disabled?: boolean;
  inputLabel?: string;
  input?: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'>;
  onSubmit: (otp: string) => unknown | Promise<unknown>;
  onError?: (error: unknown) => void | Promise<void>;
}) {
  return (
    <OneTimeOTPSubmit
      title="OTP 兜底提交"
      subtitle={subtitle}
      disabled={disabled || !submitKey}
      input={{ 'aria-label': inputLabel, className: 'w-40', maxLength: 12, ...input }}
      submit={{
        key: submitKey,
        label: '提交 OTP',
        pendingLabel: '提交中',
        icon: <Send size={14} />,
        clearOnSuccess: true,
        onRun: onSubmit,
      }}
      onError={onError}
    />
  );
}

export function AccountCarrierManualOTPSubmit<TAccount extends AccountRecordCarrier, TResult = unknown>({
  account,
  keyPrefix,
  subtitle,
  disabled,
  inputLabel,
  input,
  submit,
  onSuccess,
  onError,
}: {
  account: TAccount;
  keyPrefix: string;
  subtitle?: ReactNode;
  disabled?: boolean;
  inputLabel?: string;
  input?: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'>;
  submit: (account: TAccount, otp: string) => TResult | Promise<TResult>;
  onSuccess?: (result: TResult, account: TAccount) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}) {
  const accountID = accountCarrierID(account);
  return (
    <AccountManualOTPSubmit
      submitKey={`${keyPrefix}:${accountID}`}
      subtitle={subtitle}
      disabled={disabled || !accountID}
      inputLabel={inputLabel}
      input={input}
      onSubmit={async (otp) => {
        const result = await submit(account, otp);
        await onSuccess?.(result, account);
      }}
      onError={onError}
    />
  );
}
