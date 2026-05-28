import type { ReactNode } from 'react';

import {
  DashboardNavSection,
  type DashboardModuleManifest
} from '../proto/byte/v/forge/contracts/dashboard/v1/dashboard';

export { DashboardNavSection };
export type { DashboardModuleManifest };

export type Toast = { kind: 'ok' | 'error'; text: string } | null;
export type DisplayLabelMap = Record<string, string>;
export type PanelState = { loading: boolean; error: string };
export type RowActionDescriptor = {
  id?: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  kind?: 'primary' | 'secondary' | 'danger';
  className?: string;
};

export type DashboardModuleViewProps = {
  activeView: string;
};

export type DashboardModuleRegistration = {
  manifest: DashboardModuleManifest;
  icons?: Record<string, ReactNode>;
  views?: Record<string, (props: DashboardModuleViewProps) => ReactNode>;
};
