import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, X, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, ShieldAlert, Database } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import { sourceSchema } from '../services/schemas';
import type { Source } from '../services/schemas';
import { Panel, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const sourcesResponseSchema = z.object({
  data: z.array(sourceSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
  total_pages: z.number(),
});

const STATUS_TONES: Record<string, 'teal' | 'amber' | 'rose' | 'neutral'> = {
  verified: 'teal',
  unverified: 'amber',
  stale: 'rose',
  conflicting: 'rose',
};

const PAGE_SIZE = 12;

export function SourcesPage() {
  useDocumentTitle('Sources & Evidence — GCC Atlas');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      query: query || undefined,
      verification_status: status || undefined,
      source_type: type || undefined,
      page,
      page_size: PAGE_SIZE,
    }),
    [query, status, type, page],
  );

  const sources = useQuery({
    queryKey: ['sources', params],
    queryFn: async () => sourcesResponseSchema.parse((await api.get('/sources', { params })).data),
    placeholderData: keepPreviousData,
  });

  const totalPages = sources.data?.total_pages ?? 1;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Sources & Evidence"
        title="Every claim, traceable to a source"
        description="The evidence layer behind GCC Atlas. Each source record shows verification status, publication date, and last-verified date — missing, stale, and unverified evidence is visible, never hidden."
      />

      <Panel className="p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative flex min-w-56 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-ink-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search sources by title, notes, URL…"
              className="w-full rounded border border-border bg-surface-950 py-2 pl-9 pr-8 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
              aria-label="Search sources"
            />
            {query ? (
              <button onClick={() => setQuery('')} className="absolute right-2.5 text-ink-400 hover:text-ink-200" aria-label="Clear search">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>

          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by verification status"
            className="rounded border border-border bg-surface-950 px-2.5 py-2 text-sm text-ink-100">
            <option value="">Any status</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
            <option value="stale">Stale</option>
            <option value="conflicting">Conflicting</option>
          </select>

          <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} aria-label="Filter by source type"
            className="rounded border border-border bg-surface-950 px-2.5 py-2 text-sm text-ink-100">
            <option value="">Any type</option>
            {['company_announcement', 'government', 'report', 'news', 'job_board', 'other'].map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        {sources.data ? (
          <p className="mt-3 text-xs text-ink-400">{sources.data.total} source records match · page {sources.data.page} of {sources.data.total_pages}</p>
        ) : null}
      </Panel>

      <div className="flex items-start gap-2.5 rounded-md border border-amber-flag/25 bg-amber-flag/5 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-flag" />
        <p className="text-xs leading-relaxed text-ink-300">
          Prototype provenance note: sources marked <strong className="text-amber-flag">unverified</strong> use stable reference URLs (official portals, publication homepages, Wikipedia) with an explicit note. Before production use, each would be upgraded to exact article/policy-document links and re-verified. This transparency is deliberate — we do not claim precision we do not have.
        </p>
      </div>

      {sources.isLoading ? (
        <Spinner label="Loading source records…" />
      ) : sources.isError ? (
        <ErrorState message={(sources.error as Error).message} onRetry={() => sources.refetch()} />
      ) : sources.data!.data.length === 0 ? (
        <Panel>
          <EmptyState title="No sources match" hint="Try a different search term or clear the status filter." />
        </Panel>
      ) : (
        <div className="grid gap-3">
          {sources.data!.data.map((src) => (
            <SourceCard key={src.id} source={src} />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || sources.isFetching}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 disabled:opacity-40 hover:bg-surface-700 disabled:hover:bg-surface-800">
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <span className="font-mono text-xs text-ink-400">{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || sources.isFetching}
            className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 disabled:opacity-40 hover:bg-surface-700 disabled:hover:bg-surface-800">
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const tone = STATUS_TONES[source.verification_status] ?? 'neutral';
  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <h3 className="truncate text-[13px] font-semibold text-ink-100">{source.title}</h3>
          </div>
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] text-teal-accent hover:underline">
            {source.url} <ExternalLink className="h-3 w-3" />
          </a>
          {source.notes ? <p className="mt-2 text-xs leading-relaxed text-ink-400">{source.notes}</p> : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="slate">{source.source_type.replace(/_/g, ' ')}</Badge>
            <Badge tone={tone}>
              {source.verification_status === 'verified' ? <ShieldCheck className="h-2.5 w-2.5" /> : <ShieldAlert className="h-2.5 w-2.5" />}
              {source.verification_status}
            </Badge>
            <span className="text-[10px] text-ink-400">
              {source.publication_date ? `Published ${source.publication_date} · ` : ''}Last verified {source.last_verified_date.slice(0, 10)}
            </span>
          </div>
        </div>
      </div>
    </Panel>
  );
}
