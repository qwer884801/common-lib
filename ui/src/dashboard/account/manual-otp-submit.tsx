import type { ComponentProps } from 'react';
import { Send } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { OneTimeOTPSubmit } from '../common/one-time-otp-submit';

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
  subtitle?: string;
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
