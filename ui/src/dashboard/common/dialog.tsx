import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { cn } from '../../lib/utils';

export type DashboardDialogProps = {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  contentClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  onOpenChange: (open: boolean) => void;
};

const sizeClass = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[520px]',
  lg: 'sm:max-w-[640px]',
};

export function DashboardDialog({
  open,
  title,
  description,
  children,
  footer,
  size = 'md',
  contentClassName,
  headerClassName,
  bodyClassName,
  footerClassName,
  onOpenChange,
}: DashboardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0', sizeClass[size], contentClassName)}>
        <DialogHeader className={cn('px-6 pb-4 pl-6 pr-12 pt-6 text-left', headerClassName)}>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className={cn('px-6 py-4', bodyClassName)}>{children}</div>
        {footer && <DialogFooter className={cn('border-t bg-muted/20 px-6 py-4', footerClassName)}>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
