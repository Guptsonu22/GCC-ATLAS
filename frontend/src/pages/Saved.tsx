import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Bookmark, Scale, ExternalLink } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import {
  savedResearchSchema,
  savedComparisonSchema,
  cityDetailSchema,
  type SavedResearch,
  type SavedComparison,
} from '../services/schemas';
import { Panel, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const savedResearchListSchema = z.object({ data: z.array(savedResearchSchema) });
const savedComparisonListSchema = z.object({ data: z.array(savedComparisonSchema) });
const cityListSlimSchema = z.object({ data: z.array(cityDetailSchema) });

export const SAVED_METRIC_LABELS: Record<string, string> = {
  gcc_count_estimated: 'Est. GCC count',
  tech_talent_pool_estimated: 'Tech talent pool',
  office_rent_grade_a: 'Grade-A rent',
  metro_rail_km_operational: 'Metro km',
  senior_engineer_total_comp: 'Sr. eng comp',
  entry_engineer_total_comp: 'Entry comp',
};

type SavedTab = 'comparisons' | 'research';

export function SavedPage() {
  useDocumentTitle('Saved research — GCC Atlas');
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Saved"
        title="Your saved comparisons and research"
        description="Stored server-side under an anonymous session key held by this browser — nothing is shared across devices by design, and no account is required. Savings start from the Compare Workspace."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Saved' }]}
      />
      <SavedTabs />
    </div>
  );
}

function SavedTabs() {
  const [tab, setTab] = useState<SavedTab>('comparisons');

  return (
    <>
      <div className="flex gap-1.5" role="tablist" aria-label="Saved item type">
        <button
          role="tab"
          aria-selected={tab === 'comparisons'}
          onClick={() => setTab('comparisons')}
          className={`flex items-center gap-1.5 rounded border px-3.5 py-2 text-xs transition-colors ${
            tab === 'comparisons'
              ? 'border-teal-accent/50 bg-teal-accent/10 font-medium text-teal-accent'
              : 'border-border bg-surface-950 text-ink-300 hover:text-ink-100'
          }`}
        >
          <Scale className="h-3.5 w-3.5" aria-hidden /> City comparisons
        </button>
        <button
          role="tab"
          aria-selected={tab === 'research'}
          onClick={() => setTab('research')}
          className={`flex items-center gap-1.5 rounded border px-3.5 py-2 text-xs transition-colors ${
            tab === 'research'
              ? 'border-teal-accent/50 bg-teal-accent/10 font-medium text-teal-accent'
              : 'border-border bg-surface-950 text-ink-300 hover:text-ink-100'
          }`}
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden /> Research notes
        </button>
      </div>
      {tab === 'comparisons' ? <SavedComparisons /> : <SavedResearchList />}
    </>
  );
}

/** Id → city-name map from the shared cities query (cached across pages). */
function useCityNameMap() {
  const citiesQuery = useQuery({
    queryKey: ['cities-for-compare'],
    queryFn: async () => cityListSlimSchema.parse((await api.get('/cities')).data).data,
    staleTime: 120_000,
  });
  const map = new Map<string, string>();
  for (const c of citiesQuery.data ?? []) map.set(c.id, c.name);
  return { map, ready: !citiesQuery.isError };
}

/* ---------------- city comparisons ---------------- */

function SavedComparisons() {
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const saved = useQuery({
    queryKey: ['saved-comparisons-list'],
    queryFn: async () => savedComparisonListSchema.parse((await api.get('/saved-comparisons')).data).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/saved-comparisons/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-comparisons-list'] }),
  });

  if (saved.isLoading) return <Spinner label="Loading saved comparisons…" />;
  if (saved.isError) return <ErrorState message={(saved.error as Error).message} onRetry={() => saved.refetch()} />;

  if (saved.data!.length === 0) {
    return (
      <Panel>
        <EmptyState
          title="No saved comparisons yet"
          hint="Open the Compare Workspace, pick 2–4 cities, and press “Save to my session”. Saved comparisons stay available after navigation and refresh."
        />
        <div className="border-t border-border">
          <Link to="/compare" className="block px-5 py-3 text-xs font-medium text-teal-accent hover:bg-surface-850">
            Open the Compare Workspace →
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-3">
      {saved.data!.map((item) => (
        <SavedComparisonCard
          key={item.id}
          item={item}
          open={openId === item.id}
          onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          onDelete={() => deleteMutation.mutate(item.id)}
          busy={deleteMutation.isPending}
        />
      ))}
    </div>
  );
}

function SavedComparisonCard({
  item,
  open,
  onToggle,
  onDelete,
  busy,
}: {
  item: SavedComparison;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const { map: nameMap, ready } = useCityNameMap();
  const ids = useMemoSavedIds(item.location_ids);
  const names = ids.map((id) => nameMap.get(id) ?? id.replace('loc_', ''));

  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <Scale className={`h-4 w-4 shrink-0 ${open ? 'text-teal-accent' : 'text-ink-400'}`} aria-hidden />
        <button onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}>
          <span className="block truncate text-[14px] font-semibold text-ink-100">{item.name}</span>
          <span className="text-[11px] text-ink-400">
            {ids.length} cities{ready && names.length ? ` · ${names.join(', ')}` : ''} · saved {item.created_at.slice(0, 10)}
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link
            to={`/compare?ids=${ids.join(',')}`}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-2.5 py-1.5 text-[11px] text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent"
          >
            <ExternalLink className="h-3 w-3" aria-hidden /> Open in workspace
          </Link>
          <button
            onClick={onDelete}
            disabled={busy}
            aria-label={`Delete ${item.name}`}
            className="rounded border border-rose-flag/30 p-1.5 text-rose-flag hover:bg-rose-flag/10 disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
      {open ? <SavedComparisonDetail ids={ids} /> : null}
    </Panel>
  );
}

function useMemoSavedIds(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function SavedComparisonDetail({ ids }: { ids: string[] }) {
  const detail = useQuery({
    queryKey: ['saved-comparison-data', ids.join(',')],
    queryFn: async () =>
      z.object({ data: z.array(cityDetailSchema) }).parse(
        (await api.get('/cities/compare', { params: { ids: ids.join(',') } })).data,
      ).data,
    enabled: ids.length > 1,
  });

  if (ids.length < 2) {
    return (
      <div className="border-t border-border px-5 py-4 text-xs text-amber-flag">
        This saved comparison has fewer than 2 cities in its payload and cannot render as a matrix. Delete it and re-save from the workspace.
      </div>
    );
  }
  if (detail.isLoading) return <div className="border-t border-border"><Spinner label="Loading comparison…" /></div>;
  if (detail.isError) {
    return <div className="border-t border-border"><ErrorState message={(detail.error as Error).message} onRetry={() => detail.refetch()} /></div>;
  }

  const cities = detail.data ?? [];
  return (
    <div className="border-t border-border px-5 py-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-[12px]">
          <caption className="sr-only">Saved comparison metrics across selected cities</caption>
          <thead>
            <tr className="border-b border-border-strong">
              <th scope="col" className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Metric</th>
              {cities.map((city) => (
                <th key={city.id} scope="col" className="px-2.5 py-2 text-left text-[12px] font-semibold text-ink-100">{city.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(SAVED_METRIC_LABELS).map(([metricName, label]) => (
              <tr key={metricName} className="border-b border-border last:border-0">
                <td className="px-2.5 py-2 text-ink-300">{label}</td>
                {cities.map((city) => {
                  const m = (city.metrics ?? []).find((x) => x.metric_name === metricName);
                  return (
                    <td key={city.id} className="px-2.5 py-2 font-mono text-ink-100">
                      {m && m.metric_value !== null ? m.metric_value.toLocaleString('en-IN') : 'Not available'}
                      {m && m.is_estimate === 1 ? <Badge tone="amber" className="ml-1">est</Badge> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[10px] text-ink-400">
        Saved at creation time — {ids.length} city references; figures re-fetched live from the dataset.
      </p>
    </div>
  );
}

/* ---------------- research notes ---------------- */

function SavedResearchList() {
  const queryClient = useQueryClient();
  const research = useQuery({
    queryKey: ['saved-research'],
    queryFn: async () => savedResearchListSchema.parse((await api.get('/saved-research')).data).data,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/saved-research/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['saved-research'] }),
  });

  return (
    <div className="space-y-3">
      <Panel className="p-4">
        <p className="text-xs leading-relaxed text-ink-300">
          Research notes are written by API workflows (for example scripted research tasks) via{' '}
          <code className="rounded bg-surface-800 px-1 py-0.5 font-mono text-[10px] text-ink-300">POST /api/saved-research</code> with the session
          key. City comparisons belong on the first tab.
        </p>
      </Panel>
      {research.isLoading ? (
        <Spinner label="Loading research items…" />
      ) : research.isError ? (
        <ErrorState message={(research.error as Error).message} onRetry={() => research.refetch()} />
      ) : research.data!.length === 0 ? (
        <Panel>
          <EmptyState
            title="No research items yet"
            hint="Items created through the saved-research API will appear here, scoped to this browser session."
          />
        </Panel>
      ) : (
        (research.data ?? []).map((item) => (
          <Panel key={item.id}>
            <div className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink-100">{item.name}</p>
                <p className="text-[11px] text-ink-400">
                  {item.type.replace(/_/g, ' ')} · created {item.created_at.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={() => deleteMutation.mutate(item.id)}
                disabled={deleteMutation.isPending}
                className="rounded border border-rose-flag/30 p-1.5 text-rose-flag hover:bg-rose-flag/10 disabled:opacity-40"
                aria-label={`Delete ${item.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}
