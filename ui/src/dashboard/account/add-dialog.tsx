import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { ActionButtonGroup, type ActionButtonDescriptor } from '../common/actions';
import { DashboardDialog, type DashboardDialogProps } from '../common/dialog';
import { errorText } from '../http';
import { ToolbarIconButton } from '../uikit';
import { useAsyncActionRunner } from '../common/action-runner';

export type AccountAddDialogTrigger = 'toolbar' | 'button';

export type AccountAddDialogProps<TValues extends FieldValues> = {
  formId: string;
  defaultValues: DefaultValues<TValues>;
  title?: ReactNode;
  description?: ReactNode;
  triggerLabel?: string;
  trigger?: AccountAddDialogTrigger;
  submitLabel?: string;
  submittingLabel?: string;
  disabled?: boolean;
  size?: DashboardDialogProps['size'];
  children: (form: UseFormReturn<TValues>) => ReactNode;
  submitDisabled?: (values: TValues) => boolean;
  onSubmit: (values: TValues, form: UseFormReturn<TValues>) => unknown | Promise<unknown>;
  onDone?: (result: unknown) => void | Promise<void>;
  onError?: (message: string) => void;
};

export function AccountAddDialog<TValues extends FieldValues>({
  formId,
  defaultValues,
  title = '添加账号',
  description,
  triggerLabel = '添加账号',
  trigger = 'toolbar',
  submitLabel = '添加',
  submittingLabel = '添加中',
  disabled,
  size = 'sm',
  children,
  submitDisabled,
  onSubmit,
  onDone,
  onError,
}: AccountAddDialogProps<TValues>) {
  const [open, setOpen] = useState(false);
  const runner = useAsyncActionRunner();
  const form = useForm<TValues>({ defaultValues });
  const values = form.watch() as TValues;
  const busy = runner.busy;
  const cannotSubmit = busy || Boolean(disabled) || Boolean(submitDisabled?.(values));

  async function submit(values: TValues) {
    const result = await runner.tryRun(formId, () => onSubmit(values, form), {
      onSuccess: async (result) => {
        await onDone?.(result);
        form.reset(defaultValues);
        setOpen(false);
      },
      onError: (error) => onError?.(errorText(error)),
    });
    if (!result.ok && !onError) throw result.error;
  }

  return (
    <>
      <AccountAddTrigger mode={trigger} label={triggerLabel} disabled={disabled || busy} onClick={() => setOpen(true)} />
      <DashboardDialog open={open} title={title} description={description} size={size} footer={<ActionButtonGroup actions={footerActions({ formId, busy, cannotSubmit, submitLabel, submittingLabel, onCancel: () => setOpen(false) })} />} onOpenChange={setOpen}>
        <form id={formId} className="grid gap-3" onSubmit={form.handleSubmit(submit)}>
          {children(form)}
        </form>
      </DashboardDialog>
    </>
  );
}

function AccountAddTrigger({ mode, label, disabled, onClick }: {
  mode: AccountAddDialogTrigger;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const icon = <Plus className="size-4" />;
  if (mode === 'button') {
    return <Button size="sm" disabled={disabled} onClick={onClick}>{icon}{label}</Button>;
  }
  return <ToolbarIconButton label={label} tone="primary" icon={icon} disabled={disabled} onClick={onClick} />;
}

function footerActions({ formId, busy, cannotSubmit, submitLabel, submittingLabel, onCancel }: {
  formId: string;
  busy: boolean;
  cannotSubmit: boolean;
  submitLabel: string;
  submittingLabel: string;
  onCancel: () => void;
}): ActionButtonDescriptor[] {
  return [
    { id: 'cancel', label: '取消', variant: 'outline', onClick: onCancel },
    { id: 'submit', label: busy ? submittingLabel : submitLabel, icon: <Plus className="size-4" />, type: 'submit', form: formId, disabled: cannotSubmit },
  ];
}
