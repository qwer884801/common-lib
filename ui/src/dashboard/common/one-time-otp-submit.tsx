import { useState, type ComponentProps, type ReactNode } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useAsyncActionRunner } from './action-runner';

export type OneTimeOTPSubmitAction = {
  key: string;
  label: string;
  pendingLabel?: string;
  successText?: string;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Button>['variant'];
  enabled?: (otp: string) => boolean;
  clearOnSuccess?: boolean;
  onRun: (otp: string) => unknown | Promise<unknown>;
};

export function OneTimeOTPSubmit({ title = 'OTP 兜底提交', subtitle, input, submit, secondary, disabled, contextSlot, className = 'grid gap-3 rounded-xl border bg-card p-3', formClassName = 'flex flex-wrap items-center gap-2', onSuccess, onError }: {
  title?: ReactNode;
  subtitle?: ReactNode;
  input?: Omit<ComponentProps<typeof Input>, 'value' | 'onChange'>;
  submit: OneTimeOTPSubmitAction;
  secondary?: OneTimeOTPSubmitAction;
  disabled?: boolean;
  contextSlot?: ReactNode;
  className?: string;
  formClassName?: string;
  onSuccess?: (action: OneTimeOTPSubmitAction) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
}) {
  const runner = useAsyncActionRunner();
  const [otp, setOtp] = useState('');
  const actions = [submit, secondary].filter((item): item is OneTimeOTPSubmitAction => Boolean(item));

  async function run(action: OneTimeOTPSubmitAction) {
    await runner.tryRun(action.key, async () => {
      await action.onRun(otp);
      await onSuccess?.(action);
      if (action.clearOnSuccess) setOtp('');
    }, { onError });
  }

  return (
    <section className={className}>
      <header className="grid gap-1">
        <h3 className="text-sm font-medium leading-none">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      <form className={formClassName} onSubmit={(event) => {
        event.preventDefault();
        if (canRun(submit, otp, disabled, runner.busy)) void run(submit);
      }}>
        {contextSlot}
        <Input inputMode="numeric" autoComplete="one-time-code" placeholder="OTP" {...input} value={otp} onChange={(event) => setOtp(event.target.value)} />
        {actions.map((action) => (
          <Button key={action.key} type={action === submit ? 'submit' : 'button'} variant={action.variant} disabled={!canRun(action, otp, disabled, runner.busy)} onClick={action === submit ? undefined : () => void run(action)}>
            {action.icon ?? <Send size={14} />}
            {runner.activeKey === action.key ? action.pendingLabel || '提交中' : action.label}
          </Button>
        ))}
      </form>
    </section>
  );
}

function canRun(action: OneTimeOTPSubmitAction, otp: string, disabled?: boolean, busy?: boolean) {
  if (disabled || busy) return false;
  return action.enabled ? action.enabled(otp) : Boolean(otp.trim());
}
