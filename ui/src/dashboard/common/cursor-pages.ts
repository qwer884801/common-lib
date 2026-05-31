import { useInfiniteQuery, type InfiniteData, type QueryKey } from '@tanstack/react-query';

export const DEFAULT_CURSOR_PAGE_SIZE = 100;

export type CursorPageResponse = {
  next_cursor?: string | null;
};

export type CursorPageOptions<R extends object> = {
  queryKey: QueryKey;
  queryFn: (cursor: string) => Promise<R>;
  nextCursor?: (response: R) => string | undefined | null;
  enabled?: boolean;
  refetchInterval?: number | false;
  initialCursor?: string;
  pageSize?: number;
};

export function cursorPageNextCursor<R extends CursorPageResponse>(response: R | null | undefined) {
  return (response?.next_cursor || '').trim();
}

export function useCursorPages<R extends object>(options: CursorPageOptions<R>) {
  const query = useInfiniteQuery<R, Error, InfiniteData<R>, QueryKey, string>({
    queryKey: options.queryKey,
    queryFn: ({ pageParam }) => options.queryFn(pageParam || ''),
    initialPageParam: options.initialCursor || '',
    getNextPageParam: (lastPage) => cursorPageOptionNextCursor(options, lastPage) || undefined,
    enabled: options.enabled,
    refetchInterval: options.refetchInterval,
  });
  return {
    ...query,
    pages: query.data?.pages || [],
    loadMore: () => query.fetchNextPage().then(() => undefined),
    pagination: {
      pageSize: options.pageSize ?? DEFAULT_CURSOR_PAGE_SIZE,
      hasNext: query.hasNextPage,
      loading: query.isFetchingNextPage,
      onLoadMore: () => void query.fetchNextPage(),
    },
  };
}

export function useCursorPageItems<T, R extends object, K extends keyof R>(
  options: CursorPageOptions<R> & { field: K },
) {
  const query = useCursorPages(options);
  return {
    ...query,
    items: cursorPageItems<T, R, K>(query.pages, options.field),
  };
}

export function cursorPageItems<T, R extends object, K extends keyof R>(pages: readonly (R | null | undefined)[] | undefined | null, field: K) {
  return (pages || []).flatMap((page) => responseList<T, R, K>(page, field));
}

export function responseList<T, R extends object, K extends keyof R>(response: R | null | undefined, field: K): T[] {
  const value = response?.[field];
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function forEachCursorPageItem<T, R extends object, K extends keyof R>(options: {
  field: K;
  queryFn: (cursor: string) => Promise<R>;
  nextCursor?: (response: R) => string | undefined | null;
  onItem: (item: T) => void | Promise<void>;
  initialCursor?: string;
  maxPages?: number;
}) {
  let cursor = options.initialCursor || '';
  const maxPages = options.maxPages && options.maxPages > 0 ? options.maxPages : 100;
  for (let page = 0; page < maxPages; page += 1) {
    const response = await options.queryFn(cursor);
    const items = responseList<T, R, K>(response, options.field);
    if (!items.length) break;
    for (const item of items) await options.onItem(item);
    cursor = cursorPageOptionNextCursor(options, response);
    if (!cursor) break;
  }
}

function cursorPageOptionNextCursor<R extends object>(options: Pick<CursorPageOptions<R>, 'nextCursor'>, response: R) {
  return (options.nextCursor ? options.nextCursor(response) || '' : cursorPageNextCursor(response as CursorPageResponse)).trim();
}

export function cursorPageURL(path: string, options: {
  cursor?: string;
  limit?: number;
  params?: Record<string, string | number | boolean | null | undefined>;
}) {
  const params = new URLSearchParams();
  params.set('limit', String(options.limit ?? DEFAULT_CURSOR_PAGE_SIZE));
  for (const [key, value] of Object.entries(options.params || {})) {
    const text = String(value ?? '').trim();
    if (text) params.set(key, text);
  }
  const cursor = (options.cursor || '').trim();
  if (cursor) params.set('cursor', cursor);
  return `${path}?${params.toString()}`;
}
