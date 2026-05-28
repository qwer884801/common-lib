import { Empty, EmptyHeader, EmptyTitle } from '../../components/ui/empty';
import { TableCell, TableRow } from '../../components/ui/table';
import { cn } from '../../lib/utils';

export function EmptyTableRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow className="emptyTableRow">
      <TableCell colSpan={colSpan}>
        <EmptyBlock text={text} />
      </TableCell>
    </TableRow>
  );
}

export function EmptyBlock({ text, className }: { text: string; className?: string }) {
  return (
    <Empty className={cn('emptyBlock', className)}>
      <EmptyHeader>
        <EmptyTitle>{text}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  );
}
