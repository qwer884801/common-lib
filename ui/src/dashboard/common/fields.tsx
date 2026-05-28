import type { ReactNode } from 'react';
import { Field, FieldLabel } from '../../components/ui/field';
import { cn } from '../../lib/utils';

export * from './form-fields';
export * from './kv';

export function DashboardField({ label, children, className, labelClassName }: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <Field className={cn('gap-1', className)}>
      <FieldLabel className={labelClassName}>{label}</FieldLabel>
      {children}
    </Field>
  );
}

export function DescriptionLine({ label, value, children, className, valueClassName }: {
  label: ReactNode;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn('flex min-w-0 justify-between gap-3 text-xs', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('truncate font-medium', valueClassName)}>{children ?? value ?? '-'}</span>
    </div>
  );
}

export function MetricItem({ label, value, detail, className }: {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid min-w-0 gap-1', className)}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail !== undefined && <small>{detail}</small>}
    </div>
  );
}
