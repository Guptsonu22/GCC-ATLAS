import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, X, ChevronLeft, ChevronRight, ArrowUpDown, MapPin } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import { companiesResponseSchema, sectorSchema, locationSchema, type Company } from '../services/schemas';
import { Panel, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { CompanyDrawer } from '../components/CompanyDrawer';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const sectorsListSchema = z.array(sectorSchema);
const locationsListSchema = z.array(locationSchema);

const STATUS_TONES: Record<string, 'teal' | 'cyan' | 'amber' | 'rose' | 'neutral'> = {
  expanding: 'teal',
  active: 'cyan',
  downsizing: 'amber',
  closed: 'rose',
  announced: 'neutral',
};

const PAGE_SIZE = 12;

export function ExplorerPage() {
  useDocumentTitle('GCC Explorer — GCC Atlas');
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [sector, setSector] = useState('');
  const [city, setCity] = useState(() => searchParams.get('city') ?? '');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const lookups = useQuery({
    queryKey: ['lookups'],
    queryFn: async () => {
      const [sectorsRes, citiesRes] = await Promise.all([api.get('/sectors'), api.get('/cities')]);
      const sectors = sectorsListSchema.parse(sectorsRes.data.data);
      const cities = locationsListSchema.parse(citiesRes.data.data);
      return { sectors, cities };
    },
  });

  const filtersActive = Boolean(query || sector || city || status);
  const params = useMemo(
    () => ({
      query: query || undefined,
      sector_id: sector || undefined,
      location_id: city || undefined,
      operating_status: status || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      page_size: PAGE_SIZE,
    }),
    [query, sector, city, status, sortBy, sortOrder, page],
  );

  // Debounce keyword search
  const [debouncedParams, setDebouncedParams] = useState(params);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedParams(params), 300);
    return () => clearTimeout(t);
  }, [params]);

  const companies = useQuery({
    queryKey: ['companies', debouncedParams],
    queryFn: async () => companiesResponseSchema.parse((await api.get('/companies', { params: debouncedParams })).data),
    placeholderData: keepPreviousData,
  });

  const resetFilters = () => {
    setQuery('');
    setSector('');
    setCity('');
    setStatus('');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };

  const totalPages = companies.data?.total_pages ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="GCC Explorer"
        title="Search tracked GCC companies in India"
        description="Filter by company, city, sector, operating status, or parent company. Every record carries an evidence trail — open a company to review sources."
        right={
          <button
            onClick={() => { setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc')); }}
            className="flex items-center gap-1.5 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 hover:bg-surface-700"
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> {sortBy === 'name' ? 'Name' : sortBy === 'india_entry_year' ? 'Entry year' : 'Employees'} · {sortOrder === 'asc' ? 'A→Z' : 'Z→A'}
          </button>
        }
      />

      {/* Filter bar */}
      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex min-w-56 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search company, parent company, description…"
              className="w-full rounded border border-border bg-surface-950 py-2 pl-9 pr-8 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
              aria-label="Search companies"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="absolute right-2.5 text-ink-400 hover:text-ink-200" aria-label="Clear search">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>

          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city"
            className="rounded border border-border bg-surface-950 px-2.5 py-2 text-sm text-ink-100">
            <option value="">All cities</option>
            {(lookups.data?.cities ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}, {c.state}</option>
            ))}
          </select>

          <select value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Filter by sector"
            className="rounded border border-border bg-surface-950 px-2.5 py-2 text-sm text-ink-100">
            <option value="">All sectors</option>
            {(lookups.data?.sectors ?? []).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by operating status"
            className="rounded border border-border bg-surface-950 px-2.5 py-2 text-sm text-ink-100">
            <option value="">Any status</option>
            {['expanding', 'active', 'downsizing', 'closed', 'announced'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by"
            className="rounded border border-border bg-surface-950 px-2.5 py-2 text-sm text-ink-100">
            <option value="name">Sort: Name</option>
            <option value="india_entry_year">Sort: Entry year</option>
          </select>

          {filtersActive ? (
            <button onClick={resetFilters} className="rounded border border-amber-flag/30 bg-amber-flag/10 px-3 py-2 text-xs font-medium text-amber-flag hover:bg-amber-flag/20">
              Reset filters
            </button>
          ) : null}
        </div>
        {companies.data ? (
          <p className="mt-3 text-xs text-ink-400">
            {companies.data.total} tracked companies match
            {filtersActive ? ' your filters' : ' in the dataset'} · page {companies.data.page} of {companies.data.total_pages}
          </p>
        ) : null}
      </Panel>

      {/* Results */}
      {companies.isLoading ? (
        <Spinner label="Searching GCC records…" />
      ) : companies.isError ? (
        <ErrorState message={(companies.error as Error).message} onRetry={() => companies.refetch()} />
      ) : companies.data!.data.length === 0 ? (
        <Panel>
          <EmptyState
            title="No companies match your filters"
            hint="Try clearing the keyword or widening the city/sector filters. The tracked dataset is a subset of India's full GCC universe."
          />
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {companies.data!.data.map((company) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className="group text-left rounded-md border border-border bg-surface-900 p-4 transition-colors hover:border-teal-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[14px] font-semibold text-ink-100 group-hover:text-teal-accent">{company.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-ink-400">
                    {[company.parent_company, company.headquarters_country].filter(Boolean).join(' · ') || 'Independent'}
                  </p>
                </div>
                <Badge tone={STATUS_TONES[company.operating_status] ?? 'neutral'}>{company.operating_status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {company.sector ? <Badge tone="slate">{company.sector.name}</Badge> : null}
                {(company.locations ?? []).slice(0, 3).map((loc) => (
                  <Badge key={loc.id} tone="neutral"><MapPin className="h-2.5 w-2.5" /> {loc.location_name}</Badge>
                ))}
                {(company.locations?.length ?? 0) > 3 ? <Badge tone="neutral">+{(company.locations?.length ?? 3) - 3}</Badge> : null}
                {company.india_entry_year ? <span className="ml-auto font-mono text-[11px] text-ink-400">since {company.india_entry_year}</span> : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 disabled:opacity-40 enabled:hover:bg-surface-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="font-mono text-xs text-ink-400">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 disabled:opacity-40 enabled:hover:bg-surface-700"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {selectedCompany ? <CompanyDrawer company={selectedCompany} onClose={() => setSelectedCompany(null)} /> : null}
    </div>
  );
}
