import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Plus, Scale, ExternalLink, Info, TrendingDown, Check } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import { cityDetailSchema } from '../services/schemas';
import type { CityDetail, CityMetric } from '../services/schemas';
import { Panel, PanelHeader, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const cityDetailResponseSchema = z.object({ data: z.array(cityDetailSchema) });
const compareSchema = z.object({ data: z.array(cityDetailSchema) });

const METRIC_LABELS: Record<string, string> = {
  gcc_count_estimated: 'Estimated GCC count',
  tech_talent_pool_estimated: 'Tech talent pool',
  office_rent_grade_a: 'Grade-A office rent',
  metro_rail_km_operational: 'Metro rail network',
  senior_engineer_total_comp: 'Senior engineer comp (indicative)',
  entry_engineer_total_comp: 'Entry engineer comp (indicative)',
};

const MAX_COMPARE = 4;

export function CitiesPage() {
  useDocumentTitle('City Intelligence — GCC Atlas');
  const [selected, setSelected] = useState<string[]>(['loc_bengaluru', 'loc_hyderabad', 'loc_pune']);

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: async () => cityDetailResponseSchema.parse((await api.get('/cities')).data).data as CityDetail[],
  });

  const compareQuery = useQuery({
    queryKey: ['city-compare', selected.join(',')],
    queryFn: async () => {
      const res = await api.get('/cities/compare', { params: { ids: selected.join(',') } });
      return compareSchema.parse(res.data).data;
    },
    placeholderData: keepPreviousData,
    enabled: selected.length > 0,
  });

  const metricNames = useMemo(() => {
    const names: string[] = [];
    for (const city of compareQuery.data ?? []) {
      for (const m of city.metrics ?? []) {
        if (!names.includes(m.metric_name)) names.push(m.metric_name);
      }
    }
    return names;
  }, [compareQuery.data]);

  const toggleCity = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_COMPARE ? prev : [...prev, id],
    );
  };

  if (citiesQuery.isLoading) return <Spinner label="Loading city intelligence…" />;
  if (citiesQuery.isError) return <ErrorState message={(citiesQuery.error as Error).message} onRetry={() => citiesQuery.refetch()} />;

  const cities = citiesQuery.data!;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="City Intelligence"
        title="Compare India's GCC cities"
        description="Side-by-side view of talent, indicative compensation, office costs, infrastructure and policy support. All metrics carry definitions, time periods, and confidence flags — 'Not available' is shown rather than guessed."
        right={<Badge tone="cyan"><Scale className="h-3 w-3" /> {selected.length}/{MAX_COMPARE} selected</Badge>}
      />

      {/* City selector */}
      <Panel className="p-4">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">Select up to {MAX_COMPARE} cities</p>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => {
            const active = selected.includes(city.id);
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
      </Panel>

      {/* Comparison */}
      {selected.length === 0 ? (
        <Panel>
          <EmptyState title="No cities selected" hint={`Pick between 2 and ${MAX_COMPARE} cities above to compare them side by side.`} />
        </Panel>
      ) : compareQuery.isLoading ? (
        <Spinner label="Building comparison…" />
      ) : compareQuery.isError ? (
        <ErrorState message={(compareQuery.error as Error).message} onRetry={() => compareQuery.refetch()} />
      ) : (
        <Panel>
          <PanelHeader
            title="Comparison"
            subtitle={`${selected.length} cities × ${metricNames.length} metrics · all numeric figures are indicative estimates unless flagged otherwise`}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-180 px-5 py-2.5 text-left align-bottom text-[10px] font-semibold uppercase tracking-wider text-ink-400">Metric</th>
                  {(compareQuery.data ?? []).map((city) => (
                    <th key={city.id} className="px-4 py-2.5 text-left align-bottom">
                      <p className="text-[13px] font-semibold text-ink-100">{city.name}</p>
                      <p className="text-[10px] font-normal text-ink-400">{city.state} · {city.tracked_company_count} tracked</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricNames.map((name) => (
                  <tr key={name} className="border-b border-border transition-colors last:border-0 hover:bg-surface-850/60">
                    <td className="px-5 py-2.5 text-xs text-ink-200">{METRIC_LABELS[name] ?? name}</td>
                    {(compareQuery.data ?? []).map((city) => {
                      const metric = (city.metrics ?? []).find((m) => m.metric_name === name);
                      return (
                        <td key={city.id} className="px-4 py-2.5">
                          <MetricCell metric={metric} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="flex items-start gap-2 border-t border-border px-5 py-3 text-[11px] leading-relaxed text-ink-400">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Hover or focus a cell to read its definition. Estimates come from public market commentary (Zinnov, NASSCOM, CBRE/JLL research portals, crowd-sourced salary sites) and must be re-verified against current primary reports before use in decisions.
          </p>
        </Panel>
      )}

      {/* City detail cards with policies */}
      <div className="grid gap-5 xl:grid-cols-2">
        {cities
          .filter((c) => selected.includes(c.id))
          .map((city) => (
            <CityPolicyCard key={city.id} city={city} />
          ))}
      </div>
    </div>
  );
}

function CityPolicyCard({ city }: { city: CityDetail }) {
  const detailQuery = useQuery({
    queryKey: ['city-detail', city.id],
    queryFn: async () => cityDetailSchema.parse(await api.get(`/cities/${city.id}`).then((r) => r.data)),
  });

  const policies = detailQuery.data?.policies ?? [];

  return (
    <Panel>
      <PanelHeader
        title={`${city.name}, ${city.state}`}
        subtitle={`${city.tracked_company_count ?? 0} tracked GCC companies${city.tier ? ` · ${city.tier === 'tier1' ? 'Tier-1 market' : 'Emerging market'}` : ''}`}
      />
      {policies.length === 0 ? (
        <EmptyState title="No policy records on file" hint="We do not list policies we cannot yet verify — check official state portals." />
      ) : (
        <ul className="divide-y divide-border">
          {policies.map((p) => (
            <li key={p.id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-ink-100">{p.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {p.policy_type} · effective {p.effective_date ?? 'n/a'}{p.expiry_date ? ` · lapsed ${p.expiry_date}` : ''}
                  </p>
                </div>
                <Badge tone={p.is_active ? 'teal' : 'slate'}>{p.is_active ? 'active' : 'lapsed'}</Badge>
              </div>
              {p.description ? <p className="mt-1.5 text-xs leading-relaxed text-ink-300">{p.description}</p> : null}
              {p.source_url ? (
                <a
                  href={p.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-teal-accent hover:underline"
                >
                  Source: {p.source_title?.slice(0, 48) ?? 'state portal'} <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function MetricCell({ metric }: { metric: CityMetric | undefined }) {
  if (!metric) {
    return <span className="text-xs text-ink-400" title="No verified metric on file — not available rather than estimated">Not available</span>;
  }
  const value = metric.metric_value;
  const estimate = metric.is_estimate === 1;
  const low = metric.confidence_level === 'low';
  const title = [
    metric.metric_definition ?? '',
    `Period: ${metric.metric_period ?? 'n/a'}`,
    metric.source_title ? `Source: ${metric.source_title} (${metric.source_verification_status ?? 'unverified'})` : '',
  ].filter(Boolean).join('\n');

  return (
    <span className="group inline-flex items-baseline gap-1.5" title={title} tabIndex={0}>
      <span className={`font-mono text-[13px] ${low ? 'text-ink-300' : 'text-ink-100'}`}>
        {value === null ? 'Not available' : `${value.toLocaleString('en-IN')} ${metric.metric_unit ?? ''}`}
      </span>
      {estimate ? (
        <Badge tone={low ? 'amber' : 'neutral'} className="translate-y-[-1px]">
          <TrendingDown className="h-2.5 w-2.5" /> est
        </Badge>
      ) : null}
    </span>
  );
}
