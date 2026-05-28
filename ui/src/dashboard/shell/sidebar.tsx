import type { ReactNode } from 'react';
import { Monitor, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar
} from '../../components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { useTheme } from '../../components/theme-provider';

export type DashboardShellNavSection = 'main' | 'infrastructure' | 'lab';

export type DashboardShellNavItem = {
  key: string;
  label: string;
  icon?: ReactNode;
  section?: DashboardShellNavSection;
  disabled?: boolean;
  disabledReason?: string;
};

export type DashboardShellSidebarProps = {
  items: DashboardShellNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  infrastructureLabel?: string;
  labLabel?: string;
  brandMarkSrc?: string;
};

const THEME_OPTIONS = [
  { value: 'system', label: '跟随系统', Icon: Monitor },
  { value: 'light', label: '亮色', Icon: Sun },
  { value: 'dark', label: '暗色', Icon: Moon }
] as const;

export function DashboardShellSidebar({
  items,
  activeKey,
  onSelect,
  infrastructureLabel = '基础设施',
  labLabel = 'Lab',
  brandMarkSrc = '/favicon.svg'
}: DashboardShellSidebarProps) {
  const mainItems = items.filter((item) => (item.section ?? 'main') === 'main');
  const infraItems = items.filter((item) => item.section === 'infrastructure');
  const labItems = items.filter((item) => item.section === 'lab');

  return (
    <Sidebar collapsible="icon" aria-label="主导航">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarBrandItem brandMarkSrc={brandMarkSrc} />
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup items={mainItems} activeKey={activeKey} onSelect={onSelect} />
        {infraItems.length > 0 && (
          <>
            <SidebarSeparator />
            <NavGroup label={infrastructureLabel} items={infraItems} activeKey={activeKey} onSelect={onSelect} />
          </>
        )}
      </SidebarContent>
      {labItems.length > 0 && (
        <SidebarFooter className="dashboardSidebarLabFooter">
          <SidebarSeparator />
          <NavGroup label={labLabel} items={labItems} activeKey={activeKey} onSelect={onSelect} />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}

function SidebarBrandItem({ brandMarkSrc }: { brandMarkSrc: string }) {
  const { state, toggleSidebar } = useSidebar();
  if (state === 'collapsed') {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip="展开侧栏" aria-label="展开侧栏" className="dashboardSidebarBrand collapsedBrand" onClick={toggleSidebar}>
          <PanelLeftOpen />
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <div className="dashboardSidebarBrandRow">
        <div className="dashboardSidebarBrandLabel">
          <img className="brandMark" src={brandMarkSrc} alt="" />
        </div>
        <div className="dashboardSidebarBrandActions">
          <SidebarThemeToggle />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="收起侧栏"
                title="收起侧栏"
                className="sidebarBrandIconButton"
                onClick={toggleSidebar}
              >
                <PanelLeftClose />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">收起侧栏</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </SidebarMenuItem>
  );
}

function SidebarThemeToggle() {
  const { theme, setTheme } = useTheme();
  const currentTheme = THEME_OPTIONS.find((item) => item.value === theme) ?? THEME_OPTIONS[0];
  const CurrentIcon = currentTheme.Icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`主题：${currentTheme.label}`} className="sidebarBrandIconButton">
          <CurrentIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-32">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => {
            const nextTheme = THEME_OPTIONS.find((item) => item.value === value)?.value;
            if (nextTheme) setTheme(nextTheme);
          }}
        >
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="themeMenuItem">
              <Icon />
              <span>{label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavGroup({ label, items, activeKey, onSelect }: {
  label?: string;
  items: DashboardShellNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton
                size="lg"
                isActive={activeKey === item.key}
                disabled={item.disabled}
                aria-label={item.label}
                tooltip={item.disabledReason ? `${item.label}：${item.disabledReason}` : item.label}
                className="dashboardSidebarNavButton"
                onClick={() => onSelect(item.key)}
              >
                {item.icon}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
