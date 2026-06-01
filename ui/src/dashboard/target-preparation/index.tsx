import type { ReactNode } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';

export function TargetPreparationWorkspace({ importPanel, main, detail, className }: {
  importPanel: ReactNode;
  main: ReactNode;
  detail: ReactNode;
  className?: string;
}) {
  return <div className={cn('grid gap-4 p-4 xl:grid-cols-[360px_minmax(0,1fr)_440px]', className)}>{importPanel}{main}{detail}</div>;
}

export function TargetPreparationMain({ title, actions, children, className }: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid content-start gap-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        {actions}
      </div>
      {children}
    </div>
  );
}

export function TargetMetricGrid({ children, columns = 4, className }: {
  children: ReactNode;
  columns?: 3 | 4;
  className?: string;
}) {
  return <div className={cn('grid gap-3', columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4', className)}>{children}</div>;
}

export function TargetMetricCard({ icon, label, value, detail, tone = 'default' }: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'primary' | 'danger';
}) {
  const toneClass = tone === 'danger' ? 'text-destructive bg-destructive/10' : tone === 'primary' ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted';
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className={cn('rounded-lg p-2', toneClass)}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="truncate text-lg font-semibold leading-none">{value}</div>
          {detail && <div className="mt-1 truncate text-xs text-muted-foreground">{detail}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
