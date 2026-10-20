import { Info, TrendingDown, ExternalLink } from 'lucide-react';
import { Badge, Panel, PanelHeader, EmptyState } from './ui';
import type { CityDetail, CityMetric, PolicyRecord } from '../services/schemas';

export const METRIC_LABELS: Record<string, string> = {
  gcc_count_estimated: 'Estimated GCC count',
  tech_talent_pool_estimated: 'Tech talent pool',
  office_rent_grade_a: 'Grade-A office rent',
  metro_rail_km_operational: 'Metro rail network',
  senior_engineer_total_comp: 'Senior engineer comp (indicative)',
  entry_engineer_total_comp: 'Entry engineer comp (indicative)',
};

export const POLICY_STATUS_TONES: Record<string, 'teal' | 'amber' | 'rose' | 'slate'> = {
  finalized: 'teal',
  announced: 'amber',
  draft: 'amber',
  superseded: 'slate',
};

export const POLICY_STATUS_HINTS: Record<string, string> = {
  finalized: 'Official policy in force — figures from the notified document',
  announced: 'Announced but not yet notified — parameters may change',
  draft: 'Draft under consultation — targets must not be treated as commitments',
  superseded: 'Lapsed or replaced — kept for historical context only',
};

export function CityCompareTable({
  cities,
  compact = false,
}: {
  cities: CityDetail[];
  compact?: boolean;
}) {
  const metricNames: string[] = [];
  for (const city of cities) {
    for (const m of city.metrics ?? []) {
      if (!metricNames.includes(m.metric_name)) metricNames.push(m.metric_name);
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Comparison of GCC cities across tracked metrics; every value links to its source and confidence.
          </caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className={`${compact ? 'w-40' : 'w-180'} px-5 py-2.5 text-left align-bottom text-[10px] font-semibold uppercase tracking-wider text-ink-400`}>
                Metric
              </th>
              {cities.map((city) => (
                <th key={city.id} scope="col" className="px-4 py-2.5 text-left align-bottom">
                  <p className="text-[13px] font-semibold text-ink-100">{city.name}</p>
                  <p className="text-[10px] font-normal text-ink-400">{city.state} · {city.tracked_company_count ?? 0} tracked</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricNames.map((name) => {
              // Unit is shared per metric (locked by the backend metric registry);
              // first city reporting it defines the row's unit label.
              const unit = cities
                .map((c) => (c.metrics ?? []).find((m) => m.metric_name === name)?.metric_unit)
                .find((u) => Boolean(u)) ?? '';
              return (
              <tr key={name} className="border-b border-border transition-colors last:border-0 hover:bg-surface-850/60">
                <th scope="row" className={`${compact ? 'px-4' : 'px-5'} py-2.5 text-left text-xs font-normal text-ink-200`}>
                  <span title={`Unit: ${unit || 'not specified'} · Geographic scope: city-level`}>
                    {METRIC_LABELS[name] ?? name}
                    {unit ? <span className="ml-1 font-mono text-[10px] text-ink-400">{unit}</span> : null}
                  </span>
                </th>
                {cities.map((city) => {
                  const metric = (city.metrics ?? []).find((m) => m.metric_name === name);
                  return (
                    <td key={city.id} className={`${compact ? 'px-3' : 'px-4'} py-2.5`}>
                      <MetricCell metric={metric} />
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="flex items-start gap-2 border-t border-border px-5 py-3 text-[11px] leading-relaxed text-ink-400">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Hover or focus a cell to read its definition. Estimates come from public market commentary and must be re-verified against current primary reports before use in decisions. “Not available” means no verified record on file — not zero.
      </p>
    </>
  );
}

export function MetricCell({ metric }: { metric: CityMetric | undefined }) {
  if (!metric) {
    return (
      <span
        className="cursor-help text-xs text-ink-400"
        title="No verified metric on file — displayed as not available rather than estimated"
      >
        Not available
      </span>
    );
  }
  const value = metric.metric_value;
  const estimate = metric.is_estimate === 1;
  const low = metric.confidence_level === 'low';
  const title = [
    metric.metric_definition ?? '',
    `Unit: ${metric.metric_unit ?? 'not specified'} · Geographic scope: city-level`,
    `Period: ${metric.metric_period ?? 'n/a'}`,
    metric.source_title ? `Source: ${metric.source_title} (${metric.source_verification_status ?? 'unverified'})` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <span className="group inline-flex items-baseline gap-1.5" title={title} tabIndex={0}>
      <span
        className={`font-mono text-[13px] ${value === null || low ? 'text-ink-300' : 'text-ink-100'}`}
        aria-label={`${METRIC_LABELS[metric.metric_name] ?? metric.metric_name}: ${value === null ? 'not available' : `${value.toLocaleString('en-IN')} ${metric.metric_unit ?? ''}`} (${estimate ? 'estimate, ' : ''}${metric.confidence_level} confidence)`}
      >
        {value === null ? 'Not available' : `${value.toLocaleString('en-IN')} ${metric.metric_unit ?? ''}`}
      </span>
      {estimate ? (
        <Badge tone={low ? 'amber' : 'neutral'} className="translate-y-[-1px]">
          <TrendingDown className="h-2.5 w-2.5" aria-hidden /> est
        </Badge>
      ) : null}
    </span>
  );
}

/** Policy list with status-linked badges (draft vs finalized is never blended). */
export function PolicyList({ policies, anchorPrefix = 'policies' }: { policies: PolicyRecord[]; anchorPrefix?: string }) {
  if (policies.length === 0) {
    return (
      <EmptyState
        title="No policy records on file"
        hint="We do not list policies we cannot verify yet — check the official state portal for current schemes."
      />
    );
  }
  const tone = POLICY_STATUS_TONES;
  const hint = POLICY_STATUS_HINTS;
  return (
    <ul className="divide-y divide-border">
      {policies.map((p) => (
        <li key={p.id} id={`${anchorPrefix}-${p.id}`} className="scroll-mt-20 px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-ink-100">{p.title}</p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                {p.policy_type.replace(/_/g, ' ')} · {p.effective_date ? `effective ${p.effective_date}` : 'effective date not on file'}
                {p.expiry_date ? ` · lapsed ${p.expiry_date}` : ''}
              </p>
            </div>
            <span title={hint[p.status] ?? ''}>
              <Badge tone={tone[p.status] ?? 'neutral'}>{p.status}</Badge>
            </span>
          </div>
          {p.description ? <p className="mt-1.5 text-xs leading-relaxed text-ink-300">{p.description}</p> : null}
          {p.source_url ? (
            <a
              href={p.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-teal-accent hover:underline"
            >
              Source{p.source_publisher ? `: ${p.source_publisher}` : ''} <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          ) : (
            <p className="mt-1.5 text-[11px] text-amber-flag">Source not linked yet — verify on the state portal.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Standard "state policies" panel used by city detail + workspace. */
export function CityPoliciesPanel({ title, policies }: { title: string; policies: PolicyRecord[] }) {
  return (
    <Panel>
      <PanelHeader title={title} subtitle="Status-linked policy records — draft figures are never presented as commitments" />
      <PolicyList policies={policies} />
    </Panel>
  );
}
