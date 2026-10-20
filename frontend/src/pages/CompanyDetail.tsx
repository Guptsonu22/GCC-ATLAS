import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, CalendarDays, MapPin, ShieldCheck, ShieldAlert, Quote, Building2, Briefcase, BookmarkPlus, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { api, track } from '../services/client';
import { companyDetailComposedSchema, announcementSchema } from '../services/schemas';
import { Panel, PanelHeader, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const STATUS_TONES: Record<string, 'teal' | 'cyan' | 'amber' | 'rose' | 'neutral'> = {
  expanding: 'teal',
  active: 'cyan',
  downsizing: 'amber',
  closed: 'rose',
  announced: 'neutral',
};

const OFFICE_ICONS: Record<string, string> = {
  headquarters: 'HO',
  development_center: 'DC',
  captive: 'CU',
  bpo: 'BP',
  shared_services: 'SS',
  innovation_lab: 'IL',
  other: '—',
};

export function CompanyDetailPage() {
  const { companyId = '' } = useParams();
  useDocumentTitle('Company details — GCC Atlas');

  const company = useQuery({
    queryKey: ['company-detail', companyId],
    queryFn: async () => {
      const raw = await api.get(`/companies/${companyId}`);
      return companyDetailComposedSchema.parse({ company: raw.data }).company;
    },
    enabled: companyId !== '',
  });

  const announcements = useQuery({
    queryKey: ['company-announcements', companyId],
    queryFn: async () =>
      z.array(announcementSchema).parse(
        (await api.get('/announcements', { params: { company_id: companyId, page_size: 50 } })).data.data,
      ),
    enabled: companyId !== '',
  });

  const queryClient = useQueryClient();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const saveForLater = async (companyName: string) => {
    setSaveState('saving');
    setSaveMessage(null);
    try {
      await api.post('/saved-research', {
        name: `${companyName} — company profile`,
        type: 'company_comparison',
        data: { company_id: companyId },
      });
      setSaveState('saved');
      setSaveMessage(`Saved “${companyName} — company profile” to your session. Find it under Saved.`);
      track('saved_create', { kind: 'company_profile', ref: companyId });
      queryClient.invalidateQueries({ queryKey: ['saved-research-list'] });
    } catch (err) {
      setSaveState('error');
      setSaveMessage((err as Error).message);
    }
  };

  useEffect(() => {
    if (company.data) track('detail_view', { kind: 'company', ref: companyId });
  }, [company.data, companyId]);

  useEffect(() => {
    if (company.isError) window.scrollTo(0, 0);
  }, [company.isError]);

  if (company.isLoading) return <Spinner label="Loading company record…" />;
  if (company.isError)
    return (
      <div className="space-y-4">
        <PageHeader title="Company details" />
        <ErrorState message={(company.error as Error).message} onRetry={() => company.refetch()} />
        <Link to="/explorer" className="text-xs text-teal-accent hover:underline">← Back to GCC Explorer</Link>
      </div>
    );

  const c = company.data!;

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.name}
        crumbs={[{ label: 'Home', to: '/' }, { label: 'GCC Explorer', to: '/explorer' }, { label: c.name }]}
        description={
          c.description ??
          'No profile description on file for this company yet — its locations and sources below are still verified records.'
        }
        right={
          <>
            <button
              onClick={() => { void saveForLater(c.name); }}
              disabled={saveState === 'saving' || saveState === 'saved'}
              className="rounded border border-teal-accent/40 bg-teal-accent/10 px-3 py-1.5 text-xs font-medium text-teal-accent hover:bg-teal-accent/20 disabled:opacity-50"
              title="Persist this company record to your anonymous session"
            >
              <span className="flex items-center gap-1.5">
                {saveState === 'saving' ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />}
                {saveState === 'saved' ? 'Saved' : 'Save to my session'}
              </span>
            </button>
            {c.website ? (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent"
              >
                Official website <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : null}
          </>
        }
      />

      {saveState === 'saved' && saveMessage ? (
        <p className="rounded border border-teal-accent/30 bg-teal-accent/10 px-3 py-2 text-xs text-teal-accent">{saveMessage}</p>
      ) : null}
      {saveState === 'error' && saveMessage ? (
        <p className="rounded border border-rose-flag/30 bg-rose-flag/10 px-3 py-2 text-xs text-rose-flag" role="alert">{saveMessage}</p>
      ) : null}

      {/* Identity band */}
      <Panel>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
          <Badge tone={STATUS_TONES[c.operating_status] ?? 'neutral'}>{c.operating_status}</Badge>
          {c.sector ? <Badge tone="slate">{c.sector.name}</Badge> : null}
          {c.india_entry_year ? <Badge tone="neutral">in India since {c.india_entry_year}</Badge> : null}
          {c.headquarters_country ? <Badge tone="neutral">HQ: {[c.headquarters_city, c.headquarters_country].filter(Boolean).join(', ')}</Badge> : null}
          {c.parent_company ? <Badge tone="neutral">part of {c.parent_company}</Badge> : null}
          {c.employee_count_india !== null && c.employee_count_india !== undefined ? (
            <Badge tone="teal">{c.employee_count_india.toLocaleString('en-IN')} employees (tracked)</Badge>
          ) : null}
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Tracked locations */}
        <Panel>
          <PanelHeader title="Tracked India locations" subtitle="Where this GCC operates — with office type and establishment year" />
          {c.locations?.length ? (
            <ul className="divide-y divide-border">
              {c.locations.map((loc) => (
                <li key={loc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-ink-100">{loc.location_name}</span>
                      <span className="block truncate text-[11px] text-ink-400">{loc.location_state}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {loc.established_year ? (
                      <span className="flex items-center gap-1 text-[10px] text-ink-400">
                        <CalendarDays className="h-3 w-3" aria-hidden /> {loc.established_year}
                      </span>
                    ) : null}
                    <Badge tone={loc.is_primary ? 'teal' : 'slate'}>
                      <abbr title={loc.office_type} className="no-underline">{OFFICE_ICONS[loc.office_type] ?? '—'}</abbr>
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No location records"
              hint="Location tracking is incomplete for this company in the current dataset — absence here is not absence in reality."
            />
          )}
        </Panel>

        {/* Evidence trail */}
        <Panel>
          <PanelHeader
            title={`Evidence trail (${c.sources?.length ?? 0} source${(c.sources?.length ?? 0) === 1 ? '' : 's'})`}
            subtitle="Identity and figures are backed by these records"
          />
          {c.sources?.length ? (
            <ul className="space-y-2.5 px-5 py-4">
              {c.sources.map((src) => (
                <li key={src.id} className="rounded border border-border bg-surface-850 px-3.5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium leading-snug text-ink-100">{src.title}</p>
                    <Badge tone={src.verification_status === 'verified' ? 'teal' : src.verification_status === 'unverified' ? 'amber' : 'rose'}>
                      {src.verification_status}
                    </Badge>
                  </div>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('source_click', { kind: 'company_source', ref: src.id })}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-teal-accent hover:underline"
                  >
                    {src.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </a>
                  {src.notes ? <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">{src.notes}</p> : null}
                  <p className="mt-1 text-[10px] text-ink-400">
                    {[src.publisher ? `Publisher: ${src.publisher}` : null, src.publication_date ? `Published ${src.publication_date}` : null, `Last verified ${src.last_verified_date.slice(0, 10)}`, `Confidence: ${src.confidence_level}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-start gap-2 border-t-0 px-5 py-5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-flag" aria-hidden />
              <p className="text-[11px] leading-relaxed text-amber-flag">
                No source on file for this record yet — treat listed details as unverified.
              </p>
            </div>
          )}
        </Panel>
      </div>

      {/* Announcements */}
      <Panel>
        <PanelHeader title="Related announcements" subtitle="Tracked developments for this company, with provenance" />
        {announcements.isLoading ? (
          <Spinner label="Loading announcements…" />
        ) : announcements.isError ? (
          <ErrorState message={(announcements.error as Error).message} onRetry={() => announcements.refetch()} />
        ) : (announcements.data ?? []).length === 0 ? (
          <EmptyState title="No announcements recorded" hint="This company has no tracked developments in the dataset yet." />
        ) : (
          <ul className="divide-y divide-border">
            {(announcements.data ?? []).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug text-ink-100">{a.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{a.announcement_date}</p>
                  {a.summary ? <p className="mt-1 text-xs leading-relaxed text-ink-300">{a.summary}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Badge tone={a.announcement_type === 'policy' ? 'cyan' : 'teal'}>{a.announcement_type.replace(/_/g, ' ')}</Badge>
                  {a.source_url ? (
                    <a
                      href={a.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-ink-400 hover:text-teal-accent hover:underline"
                    >
                      source {a.source_verification_status === 'verified' ? '(verified)' : unverifiedLabel(a)}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Cross-links */}
      <Panel className="p-5">
        <h2 className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
          <Briefcase className="h-3.5 w-3.5" aria-hidden /> Continue research
        </h2>
        <div className="flex flex-wrap gap-2">
          {c.locations?.slice(0, 4).map((loc) => (
            <Link
              key={loc.id}
              to={`/compare?add=${loc.location_id}`}
              className="flex items-center gap-1.5 rounded border border-border bg-surface-850 px-3 py-1.5 text-xs text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden /> Compare {loc.location_name}
            </Link>
          ))}
          <Link
            to="/providers?category=legal"
            className="flex items-center gap-1.5 rounded border border-border bg-surface-850 px-3 py-1.5 text-xs text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Setup providers
          </Link>
          <Link
            to={`/assistant?q=${encodeURIComponent(`${c.name} India GCC operations overview`)}`}
            className="flex items-center gap-1.5 rounded border border-border bg-surface-850 px-3 py-1.5 text-xs text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent"
          >
            <Quote className="h-3.5 w-3.5" aria-hidden /> Ask the assistant
          </Link>
        </div>
      </Panel>
    </div>
  );
}

function unverifiedLabel(a: { source_verification_status?: string | null }): string {
  const s = a.source_verification_status;
  return s ? `(${s})` : '(unverified)';
}
