/** Shared pure helpers for the compare-workspace URL contract and provider capability rows. */

export function parseSavedIds(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 4);
}

export function capabilityListFromShape(
  list: unknown,
): { capability: string; source_url?: string | null }[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => {
      if (typeof item === 'string') return { capability: item };
      if (item && typeof item === 'object' && 'capability' in item) {
        const rec = item as Record<string, unknown>;
        return {
          capability: String(rec.capability),
          source_url: typeof rec.source_url === 'string' ? rec.source_url : null,
        };
      }
      return null;
    })
    .filter((x): x is { capability: string; source_url?: string | null } => x !== null);
}
