import type { ComponentProps, ReactNode } from 'react';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

export type ResultTone = 'ok' | 'warn' | 'bad' | 'idle';

export type ResultSummaryMetric = {
  id?: string;
  label: ReactNode;
  value: ReactNode;
  tone?: ResultTone;
};

export type ResultSummaryMeta = {
  id?: string;
  label: ReactNode;
  value: string;
  tone?: ResultTone;
  wide?: boolean;
};

export type ResultSummaryMethod = {
  key: string;
  label: ReactNode;
  state: ReactNode;
};

export function ResultSummaryPanel({
  title,
  subject,
  badge,
  metrics,
  methods = [],
  meta = [],
  metaLayout = 'inline',
}: {
  title: ReactNode;
  subject?: ReactNode;
  badge: { label: ReactNode; variant?: ComponentProps<typeof Badge>['variant'] };
  metrics: ResultSummaryMetric[];
  methods?: ResultSummaryMethod[];
  meta?: ResultSummaryMeta[];
  metaLayout?: 'inline' | 'grid';
}) {
  const hasDetails = methods.length > 0 || meta.length > 0;
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-xs font-medium">{title}</span>
          <span className="truncate font-mono text-[11px] text-muted-foreground">{subject || '-'}</span>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((item) => <ResultMetricChip key={item.id || String(item.label)} {...item} />)}
      </div>
      {hasDetails && <ResultDetails methods={methods} meta={meta} layout={metaLayout} />}
    </div>
  );
}

export function resultToneClass(tone: ResultTone = 'idle', chip = false) {
  const base = toneTextClass(tone);
  if (!chip) return base;
  if (tone === 'ok') return 'border-primary/30 bg-primary/5 text-primary';
  if (tone === 'bad') return 'border-destructive/30 bg-destructive/5 text-destructive';
  if (tone === 'warn') return 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-300';
  return 'bg-muted/30 text-muted-foreground';
}

function ResultDetails({ methods, meta, layout }: {
  methods: ResultSummaryMethod[];
  meta: ResultSummaryMeta[];
  layout: 'inline' | 'grid';
}) {
  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md border bg-background/70 px-2.5 py-1.5 text-[11px]">
        {meta.map((item) => <ResultGridMeta key={item.id || String(item.label)} {...item} />)}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      {methods.length > 0 && <ResultMethodGroup methods={methods} />}
      {meta.map((item) => <ResultInlineMeta key={item.id || String(item.label)} {...item} />)}
    </div>
  );
}

function ResultMetricChip({ label, value, tone = 'idle' }: ResultSummaryMetric) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px]', resultToneClass(tone, true))}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function ResultMethodGroup({ methods }: { methods: ResultSummaryMethod[] }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-muted-foreground">
      <span>方式</span>
      {methods.map((method) => (
        <span key={method.key} className="rounded bg-muted/60 px-1.5 py-0.5 font-medium text-foreground">
          {method.label} · {method.state}
        </span>
      ))}
    </span>
  );
}

function ResultInlineMeta({ label, value, tone = 'idle' }: ResultSummaryMeta) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
      <span>{label}</span>
      <span className={cn('max-w-[220px] truncate font-medium', resultToneClass(tone))} title={value}>{value}</span>
    </span>
  );
}

function ResultGridMeta({ label, value, wide, tone = 'idle' }: ResultSummaryMeta) {
  return (
    <div className={cn('min-w-0', wide && 'col-span-2')}>
      <span className="mr-1 text-muted-foreground">{label}</span>
      <span className={cn('break-words font-medium', resultToneClass(tone))}>{value}</span>
    </div>
  );
}

function toneTextClass(tone: ResultTone) {
  if (tone === 'ok') return 'text-primary';
  if (tone === 'bad') return 'text-destructive';
  if (tone === 'warn') return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}
