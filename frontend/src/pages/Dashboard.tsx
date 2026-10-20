import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Building2, MapPin, FolderKanban, Database, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/client';
import { dashboardStatsSchema, announcementSchema, type DashboardStats, type Announcement } from '../services/schemas';
import { Panel, PanelHeader, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const announcementsListSchema = z.array(announcementSchema);


const STATUS_TONES: Record<string, 'teal' | 'cyan' | 'amber' | 'rose' | 'neutral'> = {
  expanding: 'teal',
  active: 'cyan',
  downsizing: 'amber',
  closed: 'rose',
  announced: 'neutral',
};

const CHART_COLORS = ['#2dd4bf', '#38bdf8', '#818cf8', '#f59e0b', '#fb7185', '#a3e635', '#c084fc'];

export function DashboardPage() {
  useDocumentTitle('Dashboard — GCC Atlas');
  const stats = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => dashboardStatsSchema.parse((await api.get('/dashboard/stats')).data),
  });
  const announcements = useQuery({
    queryKey: ['announcements-recent'],
    queryFn: async () => {
      const res = (await api.get('/announcements', { params: { page: 1, page_size: 6 } })).data;
      const parsed = announcementsListSchema.safeParse(res.data);
      return parsed.success ? parsed.data : [];
    },
  });

  if (stats.isLoading) return <Spinner label="Loading intelligence dashboard…" />;
  if (stats.isError) return <ErrorState message={`Could not load dashboard: ${(stats.error as Error).message}`} onRetry={() => stats.refetch()} />;

  const s: DashboardStats = stats.data!;
  const maxCityCount = Math.max(...s.companies_by_city.map((c) => c.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence Dashboard"
        title="Tracked GCC landscape"
        description="Live view of the GCC Atlas tracked dataset — companies, city footprint, sector mix and evidence freshness. Counts reflect tracked records only, not the full Indian GCC universe."
      />

      {/* Data integrity notice */}
      <div className="flex items-start gap-2.5 rounded-md border border-cyan-accent/25 bg-cyan-accent/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-accent" />
        <p className="text-xs leading-relaxed text-ink-300">{s.counting_note}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi icon={Building2} label="Tracked GCCs" value={s.total_companies} to="/explorer" />
        <Kpi icon={MapPin} label="Cities tracked" value={s.total_locations} to="/cities" />
        <Kpi icon={FolderKanban} label="Sectors" value={s.total_sectors} to="/explorer" />
        <Kpi icon={Database} label="Sources on file" value={s.total_sources} to="/sources" />
        <Kpi icon={ShieldCheck} label="Providers listed" value={s.total_providers} to="/providers" />
        <Kpi icon={AlertCircle} label="Announcements (12mo)" value={s.recent_announcements} to="/sources" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* City distribution */}
        <Panel>
          <PanelHeader title="City footprint" subtitle="Number of tracked GCC companies per city (dataset scope)" />
          <div className="h-64 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s.companies_by_city.slice(0, 8)} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}>
                <XAxis dataKey="city" tick={{ fill: '#93a5c2', fontSize: 11 }} axisLine={{ stroke: '#1e3050' }} tickLine={false} interval={0} angle={-28} textAnchor="end" height={52} />
                <YAxis tick={{ fill: '#64789a', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  cursor={{ fill: 'rgba(45, 212, 191, 0.06)' }}
                  contentStyle={{ background: '#0d1729', border: '1px solid #2c4468', borderRadius: 4, fontSize: 12 }}
                  labelStyle={{ color: '#e8eef7' }}
                  formatter={(value) => [`${value} tracked companies`, null]}
                />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {s.companies_by_city.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                  <LabelList dataKey="count" position="top" style={{ fill: '#93a5c2', fontSize: 10 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="border-t border-border px-5 py-2.5 text-[11px] text-ink-400">
            Scale reference: tallest bar = {maxCityCount}. Dataset tracking density varies by city; absence of a company here does not mean absence in reality.
          </p>
        </Panel>

        {/* Sector + status */}
        <Panel>
          <PanelHeader title="Sector mix" subtitle="Tracked companies by primary sector" />
          <div className="space-y-2 px-5 py-4">
            {s.companies_by_sector.filter((x) => x.count > 0).slice(0, 8).map((sector, i) => (
              <div key={sector.sector} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-ink-200">{sector.sector}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-surface-800">
                  <div className="h-full rounded-sm" style={{ width: `${(sector.count / maxCityCount) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
                <span className="w-8 text-right font-mono text-xs text-ink-300">{sector.count}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-3.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Operating status</p>
            <div className="flex flex-wrap gap-1.5">
              {s.companies_by_status.map((status) => (
                <Badge key={status.status} tone={STATUS_TONES[status.status] ?? 'neutral'}>
                  {status.status} · {status.count}
                </Badge>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Freshness + recent announcements */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <PanelHeader title="Data coverage & freshness" subtitle="Evidence hygiene of the dataset" />
          <div className="grid grid-cols-2 gap-px bg-border">
            <FreshnessCell label="Sources verified ≤ 30 days" value={s.data_freshness.sources_verified_last_30_days} tone="teal" />
            <FreshnessCell label="Sources verified ≤ 90 days" value={s.data_freshness.sources_verified_last_90_days} tone="cyan" />
            <FreshnessCell label="Unverified sources" value={s.data_freshness.unverified_sources ?? s.data_freshness.stale_sources} tone="amber" />
            <FreshnessCell label="Total sources on file" value={s.total_sources} tone="neutral" />
          </div>
          <Link to="/sources" className="block border-t border-border px-5 py-3 text-xs font-medium text-teal-accent hover:bg-surface-850">
            Browse source records →
          </Link>
        </Panel>

        <Panel>
          <PanelHeader
            title="Recent developments"
            subtitle="Announcements in the dataset, with source provenance"
            right={<Link to="/sources" className="text-xs text-teal-accent hover:underline">View all →</Link>}
          />
          {announcements.isLoading ? (
            <Spinner label="Loading announcements…" />
          ) : announcements.isError ? (
            <ErrorState message={(announcements.error as Error).message} />
          ) : (announcements.data as Announcement[]).length === 0 ? (
            <EmptyState title="No announcements recorded yet" />
          ) : (
            <ul className="divide-y divide-border">
              {(announcements.data as Announcement[]).map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium leading-snug text-ink-100">{a.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-400">
                        {[a.company_name ?? a.location_name ?? 'Industry', a.announcement_date].filter(Boolean).join(' · ')}
                      </p>
                      {a.summary ? <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-300">{a.summary}</p> : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge tone={a.announcement_type === 'policy' ? 'cyan' : 'teal'}>{a.announcement_type.replace('_', ' ')}</Badge>
                      <a
                        href={a.source_url ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-[10px] underline-offset-2 ${a.source_url ? 'text-ink-400 hover:text-teal-accent hover:underline' : 'text-ink-400'}`}
                        onClick={(e) => (!a.source_url ? e.preventDefault() : undefined)}
                      >
                        {a.source_verification_status === 'verified' ? 'verified source ↗' : 'source (unverified) ↗'}
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
  to: string;
}) {
  return (
    <Link to={to} className="group rounded-md border border-border bg-surface-900 p-4 transition-colors hover:border-border-strong">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-400">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {label}
      </div>
      <p className="mt-1.5 font-mono text-2xl font-semibold text-ink-100 group-hover:text-teal-accent">{value}</p>
    </Link>
  );
}

function FreshnessCell({ label, value, tone }: { label: string; value: number; tone: 'teal' | 'cyan' | 'amber' | 'neutral' }) {
  return (
    <div className="bg-surface-900 px-5 py-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className={`font-mono text-xl font-semibold ${tone === 'amber' ? 'text-amber-flag' : tone === 'teal' ? 'text-teal-accent' : 'text-ink-100'}`}>{value}</span>
        {tone === 'amber' && value > 0 ? <Badge tone="amber">verify</Badge> : null}
      </p>
    </div>
  );
}
