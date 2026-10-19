import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, X, ChevronLeft, ChevronRight, MapPin, CheckCircle2, ExternalLink, ShieldCheck, SparkleOff } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import { providersResponseSchema, providerSchema, type Provider } from '../services/schemas';
import { Panel, PanelHeader, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const providerDetailSchema = z.object(providerSchema.shape);
const categories = [
  { id: '', label: 'All categories' },
  { id: 'consulting', label: 'GCC consulting & setup' },
  { id: 'recruitment', label: 'Recruitment & staffing' },
  { id: 'legal', label: 'Legal' },
  { id: 'eor', label: 'Employer of record' },
  { id: 'payroll', label: 'Payroll & HR software' },
  { id: 'real_estate', label: 'Real estate & workspace' },
] as const;

const PAGE_SIZE = 10;

export function ProvidersPage() {
  useDocumentTitle('Service Providers — GCC Atlas');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const params = useMemo(
    () => ({
      query: query || undefined,
      category: category || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [query, category, page],
  );

  const providers = useQuery({
    queryKey: ['providers', params],
    queryFn: async () => providersResponseSchema.parse((await api.get('/providers', { params })).data),
    placeholderData: keepPreviousData,
  });

  const totalPages = providers.data?.total_pages ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Service Provider Directory"
        title="Buy-side services for GCC setup"
        description="Legal, tax, recruitment, payroll, EOR, and real-estate providers relevant to setting up or scaling GCCs in India. Providers are listed because their identity and focus are verified via official websites — no reviews or quality rankings are invented."
      />

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex min-w-56 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by name, service, capability…"
              className="w-full rounded border border-border bg-surface-950 py-2 pl-9 pr-8 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
              aria-label="Search providers"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="absolute right-2.5 text-ink-400 hover:text-ink-200" aria-label="Clear search">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Provider category">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCategory(c.id); setPage(1); }}
                aria-pressed={category === c.id}
                className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                  category === c.id
                    ? 'border-teal-accent/50 bg-teal-accent/10 font-medium text-teal-accent'
                    : 'border-border bg-surface-950 text-ink-300 hover:text-ink-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {providers.data ? (
          <p className="mt-3 text-xs text-ink-400">{providers.data.total} providers match · page {providers.data.page} of {providers.data.total_pages}</p>
        ) : null}
      </Panel>

      {providers.isLoading ? (
        <Spinner label="Loading provider directory…" />
      ) : providers.isError ? (
        <ErrorState message={(providers.error as Error).message} onRetry={() => providers.refetch()} />
      ) : providers.data!.data.length === 0 ? (
        <Panel>
          <EmptyState
            title="No providers match"
            hint="We list only providers we could verify via official websites — a missing name means 'not yet verified', not 'not good'."
          />
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {providers.data!.data.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProvider(p); }}
              className="group text-left rounded-md border border-border bg-surface-900 p-4 transition-colors hover:border-teal-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-semibold text-ink-100 group-hover:text-teal-accent">{p.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-400">{p.subcategory ?? p.category.replace('_', ' ')}</p>
                </div>
                <Badge tone={p.is_verified ? 'teal' : 'amber'}>
                  <CheckCircle2 className="h-2.5 w-2.5" /> {p.is_verified ? 'verified' : 'pending'}
                </Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-300">{p.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge tone="slate">{p.category.replace('_', ' ')}</Badge>
                {(p.operating_location_objects ?? []).slice(0, 3).map((l) => (
                  <Badge key={l.id} tone="neutral"><MapPin className="h-2.5 w-2.5" /> {l.name}</Badge>
                ))}
                {(p.operating_location_objects?.length ?? 0) > 3 ? <Badge tone="neutral">+{(p.operating_location_objects?.length ?? 3) - 3}</Badge> : null}
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 disabled:opacity-40 enabled:hover:bg-surface-700">
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="font-mono text-xs text-ink-400">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 disabled:opacity-40 enabled:hover:bg-surface-700">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {selectedProvider ? <ProviderDrawer provider={selectedProvider} onClose={() => setSelectedProvider(null)} /> : null}
    </div>
  );
}

function ProviderDrawer({ provider, onClose }: { provider: Provider; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Provider details: ${provider.name}`}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} aria-hidden />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-border bg-surface-900 shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink-100">{provider.name}</h2>
            <p className="mt-0.5 text-xs text-ink-400">{provider.subcategory ?? provider.category}</p>
          </div>
          <button onClick={onClose} aria-label="Close details" className="rounded border border-border bg-surface-800 p-1.5 text-ink-300 hover:text-ink-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">About</h3>
            <p className="text-[13px] leading-relaxed text-ink-200">{provider.description}</p>
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Capabilities</h3>
            <div className="flex flex-wrap gap-1.5">
              {(provider.capability_list ?? provider.capabilities?.length ? safeJsonList(provider.capabilities) : []).map((c) => (
                <Badge key={c} tone="teal">{c}</Badge>
              ))}
              {(provider.capability_list ?? safeJsonList(provider.capabilities)).length === 0 ? (
                <p className="text-xs text-ink-400">Not available — capabilities not collected for this provider yet.</p>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Operating locations</h3>
            <p className="text-[13px] text-ink-200">
              {[
                provider.headquarters_location ? `${provider.headquarters_location.name} (HQ)` : null,
                ...(provider.operating_location_objects ?? []).map((l) => l.name),
              ].filter(Boolean).join(' · ') || 'Not available'}
            </p>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              <SparkleOff className="h-3.5 w-3.5" /> Case studies & reviews
            </h3>
            <div className="rounded border border-border bg-surface-850 px-3 py-2.5">
              <p className="text-xs leading-relaxed text-ink-400">
                Not available — this prototype does not collect client case studies or reviews, and we do not fabricate them. Judge providers via their official websites and references.
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Verification & sources
            </h3>
            <div className="rounded border border-border bg-surface-850 px-3 py-2.5">
              <p className="text-xs text-ink-300">{provider.verification_notes ?? 'Identity not yet re-verified.'}</p>
              {provider.website ? (
                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-teal-accent hover:underline">
                  Official website <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
              <p className="mt-1.5 text-[10px] text-ink-400">Founded: {provider.founded_year ?? 'n/a'}</p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function safeJsonList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
