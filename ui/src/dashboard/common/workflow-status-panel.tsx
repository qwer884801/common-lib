import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export type WorkflowStatusCard = {
  id?: string;
  icon: ReactNode;
  title: ReactNode;
  badge: ReactNode;
  text: ReactNode;
};

export type WorkflowStatusEntry = {
  key: string;
  label: ReactNode;
  webhook_path: string;
};

export function WorkflowStatusPanel({
  configured,
  loading,
  configuredTitle,
  unconfiguredTitle,
  loadingText = '加载中...',
  description,
  cards,
  workflows,
  linkHref = '/workflow',
  linkText = '打开 Workflow 状态页',
}: {
  configured: boolean;
  loading?: boolean;
  configuredTitle: ReactNode;
  unconfiguredTitle: ReactNode;
  loadingText?: ReactNode;
  description: ReactNode;
  cards: WorkflowStatusCard[];
  workflows: WorkflowStatusEntry[];
  linkHref?: string;
  linkText?: ReactNode;
}) {
  return (
    <div className="grid gap-4 p-4">
      <Alert>
        <AlertTitle>{configured ? configuredTitle : unconfiguredTitle}</AlertTitle>
        <AlertDescription>{loading ? loadingText : description}</AlertDescription>
      </Alert>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((item) => <WorkflowStatusInfoCard key={item.id || String(item.title)} {...item} />)}
      </div>
      <div className="grid gap-2">
        {workflows.map((item) => <WorkflowStatusRow key={item.key} item={item} />)}
      </div>
      <Button variant="outline" asChild>
        <a href={linkHref} target="_blank" rel="noreferrer">{linkText}</a>
      </Button>
    </div>
  );
}

function WorkflowStatusInfoCard({ icon, title, badge, text }: WorkflowStatusCard) {
  return (
    <Card>
      <CardContent className="grid gap-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            {icon}
            {title}
          </div>
          <Badge variant="outline">{badge}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function WorkflowStatusRow({ item }: { item: WorkflowStatusEntry }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-3 text-sm">
      <span>{item.label}</span>
      <code className="text-xs text-muted-foreground">{item.webhook_path}</code>
    </div>
  );
}
