import type { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { cn } from '../lib/utils';
import { WorkspaceToolbar } from './uikit';

export type WorkspacePanelProps = {
  children: ReactNode;
  workspaceClassName?: string;
  panelClassName?: string;
};

export function WorkspacePanel({ children, workspaceClassName = 'singlePaneWorkspace', panelClassName }: WorkspacePanelProps) {
  return (
    <section className={cn('workspace', workspaceClassName)}>
      <div className={cn('panel', panelClassName)}>{children}</div>
    </section>
  );
}

export type WorkspaceTabDescriptor<TValue extends string = string> = {
  value: TValue;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
  contentClassName?: string;
  triggerClassName?: string;
};

export type WorkspaceTabbedPanelProps<TValue extends string = string> = {
  tabs: readonly WorkspaceTabDescriptor<TValue>[];
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  value?: TValue;
  defaultValue?: TValue;
  onValueChange?: (value: TValue) => void;
  children?: ReactNode;
  workspaceClassName?: string;
  panelClassName?: string;
  tabsClassName?: string;
  tabsListClassName?: string;
  tabsListVariant?: 'default' | 'line';
};

export type PanelTabsProps<TValue extends string = string> = Omit<
  WorkspaceTabbedPanelProps<TValue>,
  'workspaceClassName' | 'panelClassName'
>;

export type ContentTabsProps<TValue extends string = string> = Omit<PanelTabsProps<TValue>, 'title' | 'meta' | 'actions'>;

export function ContentTabs<TValue extends string = string>({
  tabs,
  value,
  defaultValue,
  onValueChange,
  children,
  tabsClassName,
  tabsListClassName,
  tabsListVariant
}: ContentTabsProps<TValue>) {
  return (
    <TabsRoot tabs={tabs} value={value} defaultValue={defaultValue} onValueChange={onValueChange} className={tabsClassName}>
      <TabList tabs={tabs} variant={tabsListVariant} className={tabsListClassName} />
      {children}
      <TabContents tabs={tabs} />
    </TabsRoot>
  );
}

export function PanelTabs<TValue extends string = string>({
  title,
  meta,
  actions,
  value,
  defaultValue,
  onValueChange,
  children,
  tabsClassName,
  tabsListClassName,
  tabsListVariant,
  tabs
}: PanelTabsProps<TValue>) {
  return (
    <TabsRoot tabs={tabs} value={value} defaultValue={defaultValue} onValueChange={onValueChange} className={tabsClassName}>
      <WorkspaceToolbar
        title={title}
        meta={meta}
        actions={actions}
        tabs={<TabList tabs={tabs} variant={tabsListVariant} className={tabsListClassName} />}
      />
      {children}
      <TabContents tabs={tabs} />
    </TabsRoot>
  );
}

export function WorkspaceTabbedPanel<TValue extends string = string>({
  workspaceClassName,
  panelClassName,
  ...props
}: WorkspaceTabbedPanelProps<TValue>) {
  return (
    <WorkspacePanel workspaceClassName={workspaceClassName} panelClassName={panelClassName}>
      <PanelTabs {...props} />
    </WorkspacePanel>
  );
}

function TabsRoot<TValue extends string>({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  children
}: {
  tabs: readonly WorkspaceTabDescriptor<TValue>[];
  value?: TValue;
  defaultValue?: TValue;
  onValueChange?: (value: TValue) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tabs
      value={value}
      defaultValue={defaultValue ?? tabs[0]?.value}
      onValueChange={onValueChange as ((next: string) => void) | undefined}
      className={cn('flex min-h-0 flex-1 flex-col', className)}
    >
      {children}
    </Tabs>
  );
}

function TabList<TValue extends string>({ tabs, variant, className }: {
  tabs: readonly WorkspaceTabDescriptor<TValue>[];
  variant?: 'default' | 'line';
  className?: string;
}) {
  return (
    <TabsList variant={variant} className={className}>
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className={tab.triggerClassName}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

function TabContents<TValue extends string>({ tabs }: { tabs: readonly WorkspaceTabDescriptor<TValue>[] }) {
  return (
    <>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className={cn('mt-0 min-h-0 flex-1', tab.contentClassName)}>
          {tab.content}
        </TabsContent>
      ))}
    </>
  );
}
