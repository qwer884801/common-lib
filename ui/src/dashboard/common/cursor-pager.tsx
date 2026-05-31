import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
} from '../../components/ui/pagination';

export function CursorPager({
  itemCount,
  pageSize,
  hasNext,
  loading,
  onNext,
  nextText = '加载更多'
}: {
  itemCount?: number;
  pageSize?: number;
  hasNext?: boolean;
  loading?: boolean;
  onNext: () => void;
  nextText?: string;
}) {
  if (!hasNext && !itemCount) return null;
  const disabled = !hasNext || loading;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2 text-xs text-muted-foreground">
      <span>{itemCount ?? 0}/{pageSize ?? 12}</span>
      <Pagination className="w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationNext
              href="#"
              text={loading ? '加载中…' : nextText}
              aria-disabled={disabled}
              className={disabled ? 'pointer-events-none opacity-50' : undefined}
              onClick={(event) => {
                event.preventDefault();
                if (!disabled) onNext();
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
