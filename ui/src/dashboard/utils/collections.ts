export function compactValues<T>(values: readonly (T | null | undefined)[] | null | undefined): T[] {
  return (values || []).filter((value): value is T => value !== null && value !== undefined);
}

export function uniqueStrings(values: readonly unknown[] | null | undefined, options: { lowerCase?: boolean } = {}) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values || []) {
    const raw = String(value ?? '').trim();
    const key = options.lowerCase ? raw.toLowerCase() : raw;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(options.lowerCase ? key : raw);
  }
  return out;
}

export function uniqueBy<T>(items: readonly T[] | null | undefined, keyOf: (item: T) => string, mode: 'first' | 'last' = 'last') {
  const map = new Map<string, T>();
  for (const item of items || []) {
    const key = keyOf(item).trim();
    if (!key || (mode === 'first' && map.has(key))) continue;
    map.set(key, item);
  }
  return Array.from(map.values());
}

export function latestBy<T>(items: readonly T[] | null | undefined, updatedAtOf: (item: T) => number) {
  let latest: T | undefined;
  for (const item of items || []) {
    if (!latest || updatedAtOf(item) > updatedAtOf(latest)) latest = item;
  }
  return latest || null;
}

export function latestByKey<T>(items: readonly T[] | null | undefined, keyOf: (item: T) => string, updatedAtOf: (item: T) => number) {
  const map = new Map<string, T>();
  for (const item of items || []) {
    const key = keyOf(item).trim();
    if (!key) continue;
    const previous = map.get(key);
    if (!previous || updatedAtOf(item) > updatedAtOf(previous)) map.set(key, item);
  }
  return map;
}

export function keySet<T>(items: readonly T[] | null | undefined, keyOf: (item: T) => string) {
  const out = new Set<string>();
  for (const item of items || []) {
    const key = keyOf(item).trim();
    if (key) out.add(key);
  }
  return out;
}
