import type { ReactNode } from 'react';
import type { DefaultValues, FieldValues, UseFormReturn } from 'react-hook-form';
import { AccountAddDialog } from './add-dialog';
import { AccountPhoneFieldList, accountPhoneSubmitDisabled, type AccountPhoneValues } from './phone-fields';

export function AccountPhoneAddDialog<TValues extends FieldValues & AccountPhoneValues>({
  formId,
  title,
  description,
  defaultValues,
  disabled,
  idPrefix,
  countryPlaceholder,
  phonePlaceholder,
  children,
  onSubmit,
  onDone,
  onError,
}: {
  formId: string;
  title: ReactNode;
  description?: ReactNode;
  defaultValues: DefaultValues<TValues>;
  disabled?: boolean;
  idPrefix: string;
  countryPlaceholder?: string;
  phonePlaceholder?: string;
  children?: (form: UseFormReturn<TValues>) => ReactNode;
  onSubmit: (values: TValues, form: UseFormReturn<TValues>) => unknown | Promise<unknown>;
  onDone?: (result: unknown) => void | Promise<void>;
  onError?: (message: string) => void;
}) {
  return (
    <AccountAddDialog<TValues>
      formId={formId}
      title={title}
      description={description}
      defaultValues={defaultValues}
      disabled={disabled}
      submitDisabled={(values) => accountPhoneSubmitDisabled(values)}
      onError={onError}
      onDone={onDone}
      onSubmit={onSubmit}
    >
      {(form) => (
        <>
          <AccountPhoneFieldList control={form.control} idPrefix={idPrefix} countryPlaceholder={countryPlaceholder} phonePlaceholder={phonePlaceholder} />
          {children?.(form)}
        </>
      )}
    </AccountAddDialog>
  );
}
