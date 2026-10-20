import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus, Building2, Scale, MapPin } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import { locationSchema, cityDetailSchema, type Location } from '../services/schemas';
import { Panel, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { METRIC_LABELS, MetricCell, CityPoliciesPanel } from '../components/comparison';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const citiesListSchema = z.object({ data: z.array(locationSchema) });

export function CitiesPage() {
  useDocumentTitle('City Intelligence — GCC Atlas');
  const [query, setQuery] = useState('');
  const [openCityId, setOpenCityId] = useState<string | null>(null);

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: async () => citiesListSchema.parse((await api.get('/cities')).data).data,
  });

  if (citiesQuery.isLoading) return <Spinner label="Loading city intelligence…" />;
  if (citiesQuery.isError) return <ErrorState message={(citiesQuery.error as Error).message} onRetry={() => citiesQuery.refetch()} />;

  const cities = citiesQuery.data!;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? cities.filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
    : cities;
  const openCity = openCityId ? cities.find((c) => c.id === openCityId) ?? null : null;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="City Intelligence"
        title="India's GCC cities, tracked and evidenced"
        description="Each city card shows tracked company counts. Open a city for its full metric sheet (talent, cost, infrastructure — all defined and confidence-flagged) and status-linked policy records, or send it straight to the comparison workspace."
        crumbs={[{ label: 'Home', to: '/' }, { label: 'City Intelligence' }]}
      />

      <Panel className="p-4">
        <label className="relative flex min-w-56 items-center sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-ink-400" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter cities by name or state…"
            aria-label="Filter cities"
            className="w-full rounded border border-border bg-surface-950 py-2 pl-9 pr-8 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
          />
          {query ? (
            <button onClick={() => setQuery('')} aria-label="Clear city filter" className="absolute right-2.5 text-ink-400 hover:text-ink-200">
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </label>
      </Panel>

      {filtered.length === 0 ? (
        <Panel>
          <EmptyState
            title="No cities match that filter"
            hint="Try a partial name like “pradesh” or “kera”. The tracked dataset covers India's active GCC hubs — absence of a city means not-yet-tracked."
          />
        </Panel>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((city) => (
            <CityCard key={city.id} city={city} onOpen={() => setOpenCityId(city.id)} />
          ))}
        </div>
      )}

      {openCity ? <CityDetailDrawer city={openCity} onClose={() => setOpenCityId(null)} /> : null}
    </div>
  );
}

function CityCard({ city, onOpen }: { city: Location; onOpen: () => void }) {
  return (
    <Panel className="flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h2 className="min-w-0 truncate text-[14px] font-semibold text-ink-100">{city.name}</h2>
        {city.tier ? <Badge tone={city.tier === 'tier1' ? 'teal' : 'cyan'}>{city.tier === 'tier1' ? 'tier 1' : 'emerging'}</Badge> : null}
      </div>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-400">
        <MapPin className="h-3 w-3" aria-hidden /> {city.state}
      </p>
      <p className="mt-3 font-mono text-2xl font-semibold text-ink-100">
        {city.tracked_company_count ?? 0}
        <span className="ml-1.5 align-middle text-[10px] font-normal uppercase tracking-wider text-ink-400">tracked GCCs</span>
      </p>
      <div className="mt-auto flex gap-2 pt-4">
        <button
          onClick={onOpen}
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-border bg-surface-800 px-3 py-2 text-xs font-medium text-ink-100 hover:bg-surface-700"
        >
          <Building2 className="h-3.5 w-3.5" aria-hidden /> City details
        </button>
        <Link
          to={`/compare?add=${city.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded border border-teal-accent/30 bg-teal-accent/5 px-3 py-2 text-xs font-medium text-teal-accent hover:bg-teal-accent/10"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add to compare
        </Link>
      </div>
    </Panel>
  );
}

/** Drawer with the full metric sheet + policies for one city, fetched from /cities/:id. */
function CityDetailDrawer({ city, onClose }: { city: Location; onClose: () => void }) {
  const detail = useQuery({
    queryKey: ['city-detail', city.id],
    queryFn: async () => cityDetailSchema.parse((await api.get(`/cities/${city.id}`)).data),
  });

  const metrics = detail.data?.metrics ?? [];
  const tracked = detail.data?.tracked_company_count ?? city.tracked_company_count ?? 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`City details: ${city.name}`}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} aria-hidden />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-border bg-surface-900 shadow-2xl">
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink-100">{city.name}</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {city.state} · {tracked ?? 0} tracked companies
                {city.tier ? ` · ${city.tier === 'tier1' ? 'tier-1 market' : 'emerging market'}` : ''}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close city details" className="rounded border border-border bg-surface-800 p-1.5 text-ink-300 hover:text-ink-100">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={`/compare?add=${city.id}`}
              className="flex items-center gap-1.5 rounded border border-teal-accent/30 bg-teal-accent/5 px-3 py-1.5 text-xs font-medium text-teal-accent hover:bg-teal-accent/10"
            >
              <Scale className="h-3.5 w-3.5" aria-hidden /> Open in compare workspace
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {detail.isLoading ? (
            <Spinner label="Loading city sheet…" />
          ) : detail.isError ? (
            <ErrorState message={(detail.error as Error).message} onRetry={() => detail.refetch()} />
          ) : (
            <>
              <section className="px-5 py-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Metric sheet ({metrics.length} tracked metrics)
                </h3>
                {metrics.length === 0 ? (
                  <EmptyState title="No metrics on file" hint="This city has no verified metrics yet — the dataset focuses on active GCC hubs." />
                ) : (
                  <ul className="divide-y divide-border overflow-hidden rounded border border-border">
                    {metrics.map((m) => (
                      <li key={m.id ?? m.metric_name} className="flex items-center justify-between gap-3 bg-surface-850/50 px-3.5 py-2.5">
                        <span className="text-xs text-ink-200">{METRIC_LABELS[m.metric_name] ?? m.metric_name.replace(/_/g, ' ')}</span>
                        <MetricCell metric={m} />
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-[10px] leading-relaxed text-ink-400">
                  Hover or focus a value to see its definition, period and source. “Not available” means no verified record on file — never zero.
                </p>
              </section>

              <div className="mx-5">
                <CityPoliciesPanel title="State policies" policies={detail.data?.policies ?? []} />
              </div>

              <div className="px-5 py-4">
                <Link to="/compare" className="text-xs text-teal-accent hover:underline">
                  Build a full comparison →
                </Link>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
