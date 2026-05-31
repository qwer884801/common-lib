import React, { type ComponentProps } from 'react';
import { Button } from '../../components/ui/button';
import { ButtonGroup } from '../../components/ui/button-group';
import { cn } from '../../lib/utils';
import type { RowActionDescriptor } from '../types';
import { buttonHint } from '../utils';

export function RecordActionButtons({ actions }: { actions: RowActionDescriptor[] }) {
  if (actions.length === 0) return null;
  return (
    <ButtonGroup className="recordActionButtonGroup">
      {actions.map((action) => (
        <IconActionButton
          key={action.id || action.label}
          className={action.className}
          label={action.label}
          icon={action.icon}
          kind={action.kind}
          disabled={action.disabled}
          onClick={() => action.onClick()}
        />
      ))}
    </ButtonGroup>
  );
}

export type ActionButtonDescriptor = {
  id?: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  visible?: boolean;
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  type?: ComponentProps<typeof Button>['type'];
  form?: string;
  className?: string;
  onClick?: () => void;
};


export function ActionSection({ title, description, children, className, contentClassName }: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn('grid gap-3 rounded-xl border bg-card p-3', className)}>
      <header className="grid gap-1">
        <h3 className="text-sm font-medium leading-none">{title}</h3>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className={cn('grid gap-2', contentClassName)}>{children}</div>
    </section>
  );
}

export function ActionButtonGroup({ actions, className }: {
  actions: ActionButtonDescriptor[];
  className?: string;
}) {
  const visibleActions = actions.filter((action) => action.visible !== false);
  if (visibleActions.length === 0) return null;
  return (
    <ButtonGroup className={className}>
      {visibleActions.map((action) => (
        <Button
          key={action.id ?? action.label}
          className={action.className}
          variant={action.variant}
          size={action.size}
          type={action.type}
          form={action.form}
          {...buttonHint(action.hint ?? action.label)}
          disabled={action.disabled}
          onClick={action.onClick ? () => action.onClick?.() : undefined}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </ButtonGroup>
  );
}

export function IconActionButton({ label, icon, disabled, kind = 'secondary', className, onClick }: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  kind?: 'primary' | 'secondary' | 'danger';
  className?: string;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Button
      className={cn('iconActionButton', kind === 'primary' && 'primaryIconAction', kind === 'danger' && 'dangerIconAction', className)}
      {...buttonHint(label)}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
    >
      {icon}
    </Button>
  );
}
