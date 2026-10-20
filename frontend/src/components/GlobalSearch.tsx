import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { z } from 'zod';
import { Building2, MapPin, Handshake, Scale, X } from 'lucide-react';
import { api } from '../services/client';
import {
  companiesResponseSchema,
  providersResponseSchema,
  locationSchema,
  policyRecordSchema,
  type Company,
  type Provider,
  type Location,
  type PolicyRecord,
} from '../services/schemas';
import { useAppShell } from '../context/AppShellContext';

const citiesListSchema = z.object({ data: z.array(locationSchema) });
const policiesListSchema = z.object({ data: z.array(policyRecordSchema) });

interface SearchHit {
  key: string;
  kind: 'company' | 'city' | 'provider' | 'policy';
  kindLabel: string;
  title: string;
  subtitle: string;
  navigateTo: string;
}

interface SearchResults {
  companies: Company[];
  cities: Location[];
  providers: Provider[];
  policies: PolicyRecord[];
}

const COMPANY_LIMIT = 5;
const PROVIDER_LIMIT = 4;
const CITY_LIMIT = 5;
const POLICY_LIMIT = 4;

export function GlobalSearch() {
  const { searchOpen, setSearchOpen } = useAppShell();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [debounced, setDebounced] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset transient state around open/close.
  useEffect(() => {
    if (searchOpen) {
      setActiveIndex(0);
      // Defer until the input is mounted.
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
    setInput('');
    setDebounced('');
    return undefined;
  }, [searchOpen]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(input.trim()), 250);
    return () => clearTimeout(t);
  }, [input]);

  const resultsQuery = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: async (): Promise<SearchResults> => {
      const [companiesRes, providersRes, citiesRes, policiesRes] = await Promise.all([
        debounced
          ? api.get('/companies', { params: { query: debounced, page_size: 30 } })
          : Promise.resolve({ data: { data: [] } }),
        debounced
          ? api.get('/providers', { params: { query: debounced, page_size: 20 } })
          : Promise.resolve({ data: { data: [] } }),
        api.get('/cities'),
        api.get('/policies'),
      ]);
      return {
        companies: companiesResponseSchema.parse(companiesRes.data).data,
        cities: citiesListSchema.parse(citiesRes.data).data,
        providers: providersResponseSchema.parse(providersRes.data).data,
        policies: policiesListSchema.parse(policiesRes.data).data,
      };
    },
    enabled: searchOpen,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

  const hits = useMemo<SearchHit[]>(() => {
    const q = debounced.toLowerCase();
    const r = resultsQuery.data;
    if (!r) return [];

    const companyHits: SearchHit[] = (q ? r.companies.slice(0, COMPANY_LIMIT) : []).map((c) => ({
      key: `company:${c.id}`,
      kind: 'company',
      kindLabel: 'Company',
      title: c.name,
      subtitle: [c.parent_company ?? null, c.sector?.name ?? null, c.operating_status].filter(Boolean).join(' · '),
      navigateTo: `/companies/${c.id}`,
    }));

    const cityHits: SearchHit[] = (q
      ? r.cities
          .filter((c) => c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q))
          .slice(0, CITY_LIMIT)
      : []
    ).map((c) => ({
      key: `city:${c.id}`,
      kind: 'city',
      kindLabel: 'City',
      title: c.name,
      subtitle: `${c.state} · ${c.tracked_company_count ?? 0} tracked companies`,
      navigateTo: `/compare?add=${c.id}`,
    }));

    const providerHits: SearchHit[] = (q ? r.providers.slice(0, PROVIDER_LIMIT) : []).map((p) => ({
      key: `provider:${p.id}`,
      kind: 'provider',
      kindLabel: 'Provider',
      title: p.name,
      subtitle: p.subcategory ?? p.category.replace(/_/g, ' '),
      navigateTo: `/providers?focus=${p.id}`,
    }));

    const policyHits: SearchHit[] = (q
      ? r.policies
          .filter((p) => p.title.toLowerCase().includes(q) || p.state.toLowerCase().includes(q))
          .slice(0, POLICY_LIMIT)
      : []
    ).map((p) => ({
      key: `policy:${p.id}`,
      kind: 'policy',
      kindLabel: `Policy (${p.status})`,
      title: p.title,
      subtitle: p.state,
      navigateTo: `/cities#policies-${p.id}`,
    }));

    return [...companyHits, ...cityHits, ...providerHits, ...policyHits];
  }, [resultsQuery.data, debounced]);

  // Keep the active item in view during keyboard navigation.
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!searchOpen) return null;

  const choose = (hit: SearchHit) => {
    setSearchOpen(false);
    navigate(hit.navigateTo);
  };

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
      onClick={(e) => {
        if (e.target === e.currentTarget) setSearchOpen(false);
      }}
    >
      <div className="absolute inset-0 bg-black/65" aria-hidden />
      <div className="absolute left-1/2 top-16 w-[min(620px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-md border border-border-strong bg-surface-900 shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const hit = hits[activeIndex];
                if (hit) choose(hit);
              }
            }}
            placeholder="Search companies, cities, providers, policies…"
            aria-label="Search GCC Atlas records"
            aria-controls="global-search-results"
            className="w-full bg-transparent text-sm text-ink-100 outline-none placeholder:text-ink-400"
          />
          <button onClick={() => setSearchOpen(false)} aria-label="Close search" className="rounded p-1 text-ink-400 hover:text-ink-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div id="global-search-results" ref={listRef} role="listbox" aria-label="Search results" aria-activedescendant={hits[activeIndex] ? `hit-${activeIndex}` : undefined} className="max-h-[60vh] overflow-y-auto">
          {resultsQuery.isLoading && debounced ? (
            <p className="px-4 py-6 text-center text-xs text-ink-400">Searching…</p>
          ) : hits.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-xs text-ink-300">
                {debounced ? 'No matching records yet.' : 'Type to search across GCC records.'}
              </p>
              <p className="mt-1 text-[11px] text-ink-400">
                {debounced
                  ? 'The tracked dataset covers a subset of India’s GCC universe — try shorter keywords like “Bengaluru”, “Wipro”, “legal” or “policy”.'
                  : 'Companies, cities, service providers, and policy records. Use ↑ ↓ to navigate, Enter to open.'}
              </p>
            </div>
          ) : (
            hits.map((hit, i) => (
              <button
                key={hit.key}
                id={`hit-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                data-active={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => choose(hit)}
                className={`flex w-full items-center gap-3 border-b border-border/60 px-4 py-2.5 text-left last:border-0 ${
                  i === activeIndex ? 'bg-surface-850' : 'bg-surface-900'
                }`}
              >
                <KindIcon kind={hit.kind} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink-100">{hit.title}</span>
                  <span className="block truncate text-[11px] text-ink-400">{hit.subtitle}</span>
                </span>
                <span className="shrink-0 rounded border border-border bg-surface-800 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-ink-400">
                  {hit.kindLabel}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-850 px-4 py-2 text-[10px] text-ink-400">
          <span>↑ ↓ navigate · ↵ open · esc close</span>
          <span className="truncate">Searches the tracked GCC Atlas dataset</span>
        </div>
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: SearchHit['kind'] }) {
  const cls = 'h-3.5 w-3.5 shrink-0 text-ink-400';
  if (kind === 'city' || kind === 'policy') {
    return kind === 'policy' ? <Scale className={cls} aria-hidden /> : <MapPin className={cls} aria-hidden />;
  }
  if (kind === 'provider') return <Handshake className={cls} aria-hidden />;
  return <Building2 className={cls} aria-hidden />;
}
