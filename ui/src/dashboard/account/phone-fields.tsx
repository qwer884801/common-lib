import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import type { Control, FieldValues, Path } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ControlledInputFieldList, type ControlledInputFieldDescriptor } from '../common/form-fields';

export type AccountPhoneValues = { phone: string; country_calling_code: string };

export type AccountPhoneResolveResult<TTarget> = { target: TTarget | null; error?: string };

export function AccountPhoneFieldList<TValues extends FieldValues>({
  control,
  idPrefix,
  countryPlaceholder = '+1',
  phonePlaceholder = '4155550123',
  countryLabel = '拨号码',
  phoneLabel = '手机号',
  countryName = 'country_calling_code' as Path<TValues>,
  phoneName = 'phone' as Path<TValues>,
}: {
  control: Control<TValues>;
  idPrefix: string;
  countryPlaceholder?: string;
  phonePlaceholder?: string;
  countryLabel?: string;
  phoneLabel?: string;
  countryName?: Path<TValues>;
  phoneName?: Path<TValues>;
}) {
  return <ControlledInputFieldList control={control} fields={accountPhoneFields<TValues>({ idPrefix, countryPlaceholder, phonePlaceholder, countryLabel, phoneLabel, countryName, phoneName })} />;
}

export function AccountPhoneProbeForm<TTarget>({
  title,
  disabled,
  resultSlot,
  emptyResultText,
  countryPlaceholder,
  phonePlaceholder,
  actionLabel,
  resolve,
  onSubmit,
  onError,
}: {
  title: ReactNode;
  disabled?: boolean;
  resultSlot?: ReactNode;
  emptyResultText: ReactNode;
  countryPlaceholder: string;
  phonePlaceholder: string;
  actionLabel: string;
  resolve: (values: AccountPhoneValues) => AccountPhoneResolveResult<TTarget>;
  onSubmit: (target: TTarget) => void | Promise<void>;
  onError: (message: string) => void;
}) {
  const form = useForm<AccountPhoneValues>({ defaultValues: { phone: '', country_calling_code: '' } });
  const submit = form.handleSubmit((values) => {
    const resolved = resolve(values);
    if (!resolved.target) {
      onError(resolved.error || '请输入手机号和国家拨号码。');
      return;
    }
    void onSubmit(resolved.target);
  });
  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="mb-1.5 mr-1 min-w-[5.5rem] text-sm font-medium">{title}</div>
          <form className="flex shrink-0 flex-wrap items-end gap-2" onSubmit={submit}>
            <CompactPhoneInput control={form.control} name="country_calling_code" label="拨号码" placeholder={countryPlaceholder} className="w-[86px]" />
            <CompactPhoneInput control={form.control} name="phone" label="手机号" placeholder={phonePlaceholder} className="w-[180px] sm:w-[220px]" />
            <Button className="size-8" type="submit" size="icon" aria-label={actionLabel} title={actionLabel} disabled={disabled}>
              <Search size={16} />
            </Button>
          </form>
          <div className="min-h-[58px] min-w-[300px] flex-1 rounded-lg border bg-muted/20 p-2">
            {resultSlot || <div className="flex h-full items-center text-xs text-muted-foreground">{emptyResultText}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function accountPhoneSubmitDisabled(values: Partial<AccountPhoneValues>) {
  return !String(values.phone || '').trim() || !accountCallingCodeDigits(values.country_calling_code || '');
}

export function accountCallingCodeDigits(value: string) {
  return value.replace(/\D+/g, '');
}

export function accountCallingCodePrefix(value: string) {
  const digits = accountCallingCodeDigits(value);
  return digits ? `+${digits}` : '';
}

function accountPhoneFields<TValues extends FieldValues>({ idPrefix, countryPlaceholder, phonePlaceholder, countryLabel, phoneLabel, countryName, phoneName }: {
  idPrefix: string;
  countryPlaceholder: string;
  phonePlaceholder: string;
  countryLabel: string;
  phoneLabel: string;
  countryName: Path<TValues>;
  phoneName: Path<TValues>;
}): ControlledInputFieldDescriptor<TValues>[] {
  return [
    { id: 'country_calling_code', name: countryName, label: countryLabel, placeholder: countryPlaceholder, inputId: `${idPrefix}-country-calling-code` },
    { id: 'phone', name: phoneName, label: phoneLabel, placeholder: phonePlaceholder, inputId: `${idPrefix}-phone` },
  ];
}

function CompactPhoneInput({ control, name, label, placeholder, className }: {
  control: Control<AccountPhoneValues>;
  name: keyof AccountPhoneValues;
  label: string;
  placeholder: string;
  className: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 text-[11px] text-muted-foreground">{label}</Label>
      <Controller control={control} name={name} render={({ field }) => <Input {...field} value={field.value || ''} type="tel" inputMode={name === 'country_calling_code' ? 'numeric' : 'tel'} placeholder={placeholder} className="h-8" />} />
    </div>
  );
}
