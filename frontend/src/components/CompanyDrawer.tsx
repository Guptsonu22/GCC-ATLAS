import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, FileText, MapPin, CalendarDays, Quote, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { Company, Source } from '../services/schemas';
import { Badge, EmptyState } from './ui';

export function CompanyDrawer({ company, onClose }: { company: Company; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sources: Source[] = company.sources ?? [];
  const announcements = (company.announcements ?? []) as {
    id: string; title: string; summary?: string | null; announcement_date: string; source_url?: string | null;
  }[];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Company details: ${company.name}`}>
      <div className="absolute inset-0 bg-black/65" onClick={onClose} aria-hidden />
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-border bg-surface-900 shadow-2xl"
      >
        <header className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-100">{company.name}</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {[company.parent_company, company.sector?.name].filter(Boolean).join(' · ')}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close details" className="rounded border border-border bg-surface-800 p-1.5 text-ink-300 hover:text-ink-100">
              <ExternalLink className="hidden h-4 w-4" />
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone={company.operating_status === 'expanding' ? 'teal' : 'cyan'}>{company.operating_status}</Badge>
            {company.india_entry_year ? <Badge tone="neutral">in India since {company.india_entry_year}</Badge> : null}
            {company.headquarters_country ? <Badge tone="neutral">HQ: {company.headquarters_city ?? ''} {company.headquarters_country}</Badge> : null}
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {company.description ? (
            <section>
              <SectionTitle icon={FileText} title="Profile" />
              <p className="text-[13px] leading-relaxed text-ink-200">{company.description}</p>
            </section>
          ) : null}

          <section>
            <SectionTitle icon={MapPin} title="Tracked India locations" />
            {company.locations?.length ? (
              <ul className="divide-y divide-border overflow-hidden rounded border border-border">
                {company.locations.map((loc) => (
                  <li key={loc.id} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span className="text-ink-200">
                      <span className="font-medium">{loc.location_name}</span>
                      <span className="text-ink-400"> · {loc.location_state}</span>
                    </span>
                    <span className="flex items-center gap-2 text-ink-400">
                      {loc.established_year ? <CalendarDays className="h-3 w-3" /> : null}
                      {loc.established_year ? `since ${loc.established_year}` : null}
                      <Badge tone={loc.is_primary ? 'teal' : 'slate'}>{loc.office_type.replace(/_/g, ' ')}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No location records" hint="Location coverage is incomplete for this company in the current dataset." />
            )}
          </section>

          {announcements.length ? (
            <section>
              <SectionTitle icon={Quote} title="Related announcements" />
              <ul className="space-y-2">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded border border-border bg-surface-850 px-3 py-2.5">
                    <p className="text-[13px] font-medium text-ink-100">{a.title}</p>
                    {a.summary ? <p className="mt-1 text-xs leading-relaxed text-ink-300">{a.summary}</p> : null}
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-400">{a.announcement_date}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <SectionTitle icon={ShieldCheck} title={`Evidence trail (${sources.length} source${sources.length === 1 ? '' : 's'})`} />
            {sources.length ? (
              <ul className="space-y-2">
                {sources.map((src) => (
                  <li key={src.id} className="rounded border border-border bg-surface-850 px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink-100">{src.title}</p>
                      <Badge tone={src.verification_status === 'verified' ? 'teal' : src.verification_status === 'unverified' ? 'amber' : 'rose'}>
                        {src.verification_status}
                      </Badge>
                    </div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-[11px] text-teal-accent hover:underline">
                      {src.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)} <ExternalLink className="h-3 w-3" />
                    </a>
                    {src.notes ? <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">{src.notes}</p> : null}
                    <p className="mt-1 text-[10px] text-ink-400">Last verified: {src.last_verified_date.slice(0, 10)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 rounded border border-amber-flag/30 bg-amber-flag/10 px-3 py-2.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-flag" />
                <p className="text-[11px] text-amber-flag">No source on file for this record yet — treat details as unverified.</p>
              </div>
            )}
          </section>

          <Link
            to={`/companies/${company.id}`}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-teal-accent/40 bg-teal-accent/10 px-4 py-2.5 text-xs font-semibold text-teal-accent hover:bg-teal-accent/15"
          >
            Open full company record →
          </Link>
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof MapPin; title: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {title}
    </h3>
  );
}
