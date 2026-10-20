import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Trash2, Link2, Download, BookmarkPlus, FileSpreadsheet, Loader2, Pencil } from 'lucide-react';
import { z } from 'zod';
import { api, track } from '../services/client';
import { parseSavedIds } from '../utils/cityIds';
import { cityDetailSchema, savedComparisonSchema, type SavedComparison } from '../services/schemas';
import { Panel, PanelHeader, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { CityCompareTable, POLICY_STATUS_HINTS } from '../components/comparison';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const cityListResponseSchema = z.object({ data: z.array(cityDetailSchema) });
const compareResponseSchema = z.object({ data: z.array(cityDetailSchema) });
const savedCompareListSchema = z.object({ data: z.array(savedComparisonSchema) });

const MAX_COMPARE = 4;

export function CompareWorkspacePage() {
  useDocumentTitle('Compare Workspace — GCC Atlas');
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Selection lives in the URL (?ids=a,b,c) so comparisons are shareable and refresh-safe.
  const ids = useMemo(() => {
    const parsed = parseSavedIds(searchParams.get('ids'));
    // ?add=id from the global search / city pages — appended up to the max.
    const add = searchParams.get('add');
    const merged = parsed;
    if (add && !merged.includes(add) && merged.length < MAX_COMPARE) merged.push(add);
    return Array.from(new Set(merged)).slice(0, MAX_COMPARE);
  }, [searchParams]);

  // Clear one-shot ?add= after merging it into ?ids=.
  useEffect(() => {
    if (searchParams.get('add')) {
      const next = new URLSearchParams(searchParams);
      next.delete('add');
      if (ids.length > 0) next.set('ids', ids.join(','));
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, ids, setSearchParams]);

  const setIds = (next: string[]) => {
    const params = new URLSearchParams(searchParams);
    params.delete('add');
    if (next.length > 0) params.set('ids', next.join(','));
    else params.delete('ids');
    setSearchParams(params, { replace: false });
  };

  const toggleCity = (id: string) => {
    setIds(ids.includes(id) ? ids.filter((x) => x !== id) : ids.length >= MAX_COMPARE ? ids : [...ids, id]);
  };

  const citiesQuery = useQuery({
    queryKey: ['cities-for-compare'],
    queryFn: async () => cityListResponseSchema.parse((await api.get('/cities')).data).data,
    staleTime: 120_000,
  });

  const compareQuery = useQuery({
    queryKey: ['compare', ids.join(',')],
    queryFn: async () =>
      compareResponseSchema.parse((await api.get('/cities/compare', { params: { ids: ids.join(',') } })).data).data,
    enabled: ids.length > 0,
    placeholderData: keepPreviousData,
  });

  const cities = citiesQuery.data ?? [];

  const savedQuery = useQuery({
    queryKey: ['saved-comparisons-list'],
    queryFn: async () => savedCompareListSchema.parse((await api.get('/saved-comparisons')).data).data,
  });

  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const saveComparison = async () => {
    if (ids.length < 2) {
      setSaveError('Select at least 2 distinct cities before saving a comparison.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      const created = await api.post('/saved-comparisons', {
        name: saveName.trim() || `Comparison ${new Date().toISOString().slice(0, 10)} (${ids.length} cities)`,
        location_ids: ids,
      });
      setSaveOk(`Saved “${(created.data as SavedComparison).name}”. Find it any time under Saved.`);
      setSaveName('');
      track('compare_create', { city_count: String(ids.length) });
      queryClient.invalidateQueries({ queryKey: ['saved-comparisons-list'] });
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSaved = async (id: string) => {
    await api.delete(`/saved-comparisons/${id}`);
    queryClient.invalidateQueries({ queryKey: ['saved-comparisons-list'] });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setSaveOk('Comparison link copied to clipboard.');
      setSaveError(null);
    } catch {
      setSaveError('Clipboard is unavailable — copy the browser URL manually.');
    }
  };

  const exportCsv = () => {
    const rows = compareQuery.data ?? [];
    if (rows.length === 0) return;
    const metricNames: string[] = [];
    for (const city of rows) {
      for (const m of city.metrics ?? []) if (!metricNames.includes(m.metric_name)) metricNames.push(m.metric_name);
    }
    const header = ['metric', ...rows.map((c) => `${c.name} (${c.id})`)];
    const lines = [header.join(',')];
    for (const name of metricNames) {
      const cells = rows.map((c) => {
        const m = (c.metrics ?? []).find((x) => x.metric_name === name);
        if (!m || m.metric_value === null) return '"';
        return `"${m.metric_value}${m.metric_unit ? ` ${m.metric_unit}` : ''}${m.is_estimate === 1 ? ' (estimated)' : ''}"`;
      });
      lines.push([`"${name}"`, ...cells].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    track('export', { format: 'csv', city_count: String(rows.length) });
    const a = document.createElement('a');
    a.href = url;
    a.download = `gcc-comparison-${ids.join('-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Compare Workspace"
        title="City comparison workspace"
        description="Build a side-by-side comparison of up to 4 GCC cities: metrics, incentive policies and provenance. Save it to your session, copy the shareable link, or export the matrix as CSV."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'Compare Workspace' }]}
        right={
          <Badge tone="cyan">
            {ids.length}/{MAX_COMPARE} cities
          </Badge>
        }
      />

      {/* City selector */}
      <Panel className="p-4">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Select up to {MAX_COMPARE} cities
        </p>
        {citiesQuery.isLoading ? (
          <Spinner label="Loading cities…" />
        ) : citiesQuery.isError ? (
          <ErrorState message={(citiesQuery.error as Error).message} onRetry={() => citiesQuery.refetch()} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {cities.map((city) => {
              const active = ids.includes(city.id);
              return (
                <button
                  key={city.id}
                  onClick={() => toggleCity(city.id)}
                  aria-pressed={active}
                  className={`flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? 'border-teal-accent/50 bg-teal-accent/10 font-medium text-teal-accent'
                      : 'border-border bg-surface-950 text-ink-300 hover:border-border-strong hover:text-ink-100'
                  }`}
                >
                  {active ? <Check aria-hidden className="h-3 w-3" /> : <Plus className="h-3 w-3" aria-hidden />}
                  {city.name}
                  <span className="font-mono text-[10px] opacity-70">{city.tracked_company_count ?? 0}</span>
                </button>
              );
            })}
          </div>
        )}
      </Panel>

      {/* Workspace layout: comparison + saving sidebar */}
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {ids.length === 0 ? (
            <Panel>
              <EmptyState
                title="No cities selected yet"
                hint="Pick 2–4 cities above (or use global search → city → adds here). The matrix shows tracked metrics, policy status and provenance side by side."
              />
            </Panel>
          ) : compareQuery.isLoading ? (
            <Spinner label="Building comparison…" />
          ) : compareQuery.isError ? (
            <ErrorState message={(compareQuery.error as Error).message} onRetry={() => compareQuery.refetch()} />
          ) : (
            <Panel>
              <PanelHeader
                title="Metric matrix"
                subtitle={`${ids.length} cities × ${(compareQuery.data ?? []).reduce((n, c) => n + (c.metrics?.length ?? 0), 0) as number} tracked metric rows · every figure is defined, sourced and confidence-flagged`}
              />
              <CityCompareTable cities={compareQuery.data ?? []} />
            </Panel>
          )}
        </div>

        {/* Save / share / export */}
        <div className="space-y-4">
          <Panel className="p-4">
            <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden /> Save this comparison
            </h2>
            <label htmlFor="compare-save-name" className="mb-1.5 block text-[11px] text-ink-300">
              Name (optional)
            </label>
            <input
              id="compare-save-name"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="e.g. Hub shortlist — Q4 review"
              className="w-full rounded border border-border bg-surface-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
            />
            <button
              onClick={() => { void saveComparison(); }}
              disabled={saving || ids.length < 2}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded bg-teal-accent px-4 py-2.5 text-sm font-semibold text-surface-950 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />}
              {saving ? 'Saving…' : 'Save to my session'}
            </button>
            {saveError ? <p className="mt-2 text-[11px] text-rose-flag" role="alert">{saveError}</p> : null}
            {saveOk ? <p className="mt-2 text-[11px] text-teal-accent" role="status">{saveOk}</p> : null}
            {ids.length < 2 ? (
              <p className="mt-2 text-[11px] text-ink-400">Saving needs at least 2 distinct cities.</p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => { void copyLink(); }}
                className="flex items-center justify-center gap-1.5 rounded border border-border bg-surface-800 px-3 py-2 text-xs text-ink-200 hover:bg-surface-700"
              >
                <Link2 className="h-3.5 w-3.5" aria-hidden /> Copy link
              </button>
              <button
                onClick={exportCsv}
                disabled={ids.length === 0}
                className="flex items-center justify-center gap-1.5 rounded border border-border bg-surface-800 px-3 py-2 text-xs text-ink-200 hover:bg-surface-700 disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" aria-hidden /> CSV
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="My saved comparisons"
              subtitle="Stored server-side for this browser session"
              right={<Link to="/saved" className="text-[11px] text-teal-accent hover:underline">All saved →</Link>}
            />
            {savedQuery.isLoading ? (
              <Spinner label="Loading saved…" />
            ) : savedQuery.isError ? (
              <ErrorState message={(savedQuery.error as Error).message} onRetry={() => savedQuery.refetch()} />
            ) : (savedQuery.data ?? []).length === 0 ? (
              <EmptyState title="No saved comparisons yet" hint="Build a 2–4 city comparison and save it — it will stay available across refreshes and navigation." />
            ) : (
              <ul className="divide-y divide-border">
                {(savedQuery.data ?? []).map((s) => {
                  const savedIds = JSON.parse(s.location_ids) as string[];
                  if (renamingId === s.id) {
                    return (
                      <li key={s.id} className="flex items-center gap-2 px-4 py-2.5">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          maxLength={200}
                          aria-label="New comparison name"
                          className="min-w-0 flex-1 rounded border border-teal-accent/40 bg-surface-950 px-2 py-1.5 text-[13px] text-ink-100"
                        />
                        <button
                          aria-label="Save new name"
                          disabled={renaming || !renameValue.trim()}
                          onClick={async () => {
                            setRenaming(true);
                            try {
                              await api.patch(`/saved-comparisons/${s.id}`, { name: renameValue.trim() });
                              setRenamingId(null);
                              queryClient.invalidateQueries({ queryKey: ['saved-comparisons-list'] });
                            } catch (err) {
                              setSaveError((err as Error).message);
                            } finally {
                              setRenaming(false);
                            }
                          }}
                          className="flex items-center gap-1 rounded border border-teal-accent/40 bg-teal-accent/10 px-2.5 py-1.5 text-xs font-medium text-teal-accent disabled:opacity-40"
                        >
                          {renaming ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Check className="h-3 w-3" aria-hidden />} Save name
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={s.id} className="flex items-center gap-2 px-4 py-2.5">
                      <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                      <button
                        onClick={() => {
                          setIds(savedIds);
                          track('compare_reopen', { source: 'saved_list', city_count: String(savedIds.length) });
                        }}
                        className="min-w-0 flex-1 text-left"
                        title={`Load ${savedIds.length} cities into the workspace`}
                      >
                        <span className="block truncate text-[13px] font-medium text-ink-100 hover:text-teal-accent">{s.name}</span>
                        <span className="block truncate text-[10px] text-ink-400">
                          {savedIds.length} cities · saved {s.created_at.slice(0, 10)}
                        </span>
                      </button>
                      <button
                        onClick={() => { setRenamingId(s.id); setRenameValue(s.name); }}
                        aria-label={`Rename saved comparison ${s.name}`}
                        className="rounded border border-border p-1.5 text-ink-300 hover:text-ink-100"
                      >
                        <Pencil className="h-3 w-3" aria-hidden />
                      </button>
                      <button
                        onClick={() => { void deleteSaved(s.id); }}
                        aria-label={`Delete saved comparison ${s.name}`}
                        className="rounded border border-rose-flag/30 p-1.5 text-rose-flag hover:bg-rose-flag/10"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      {/* Policy status panel per selected city */}
      {citiesQuery.data && ids.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {cities
            .filter((c) => ids.includes(c.id))
            .map((city) => (
              <CityPolicySummary key={city.id} cityId={city.id} cityLabel={`${city.name}, ${city.state}`} />
            ))}
        </div>
      ) : null}
    </div>
  );
}

function CityPolicySummary({ cityId, cityLabel }: { cityId: string; cityLabel: string }) {
  const q = useQuery({
    queryKey: ['city-policies', cityId],
    queryFn: async () => cityDetailSchema.parse((await api.get(`/cities/${cityId}`)).data),
  });
  const policies = q.data?.policies ?? [];

  return (
    <Panel>
      <PanelHeader
        title={cityLabel}
        subtitle="Policy status in force — hover a badge for what each status means"
      />
      {q.isLoading ? (
        <Spinner label="Loading policies…" />
      ) : q.isError ? (
        <ErrorState message={(q.error as Error).message} onRetry={() => q.refetch()} />
      ) : (
        <ul className="divide-y divide-border">
          {policies.map((p) => (
            <li key={p.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-ink-100">{p.title}</p>
                <p className="truncate text-[10px] text-ink-400">
                  {p.effective_date ? `effective ${p.effective_date}` : 'date not on file'}
                  {p.expiry_date ? ` · lapsed ${p.expiry_date}` : ''}
                </p>
              </div>
              <span title={POLICY_STATUS_HINTS[p.status] ?? ''}>
                <Badge tone={p.status === 'finalized' ? 'teal' : p.status === 'superseded' ? 'slate' : 'amber'}>{p.status}</Badge>
              </span>
            </li>
          ))}
          {policies.length === 0 ? (
            <li className="px-4 py-3 text-[11px] text-ink-400">No policy records on file for this city yet.</li>
          ) : null}
        </ul>
      )}
    </Panel>
  );
}
