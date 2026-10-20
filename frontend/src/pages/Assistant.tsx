import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles, Send, AlertTriangle, Info, Quote, ExternalLink, ShieldAlert, Cpu, FlaskConical,
  Lightbulb, Table2, Compass, ListChecks, CircleSlash,
} from 'lucide-react';
import { api, track } from '../services/client';
import { aiQueryResponseSchema, assistantStatusSchema } from '../services/schemas';
import { Badge, Spinner, ErrorState, Panel, PanelHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SUGGESTIONS = [
  'Compare Hyderabad and Pune for an engineering GCC',
  'Which tracked GCCs have announced expansion activity recently?',
  'Which providers have documented experience with GCC setup?',
  'What are the known incentives in Karnataka, and what eligibility conditions apply?',
  'What evidence is missing before making a location decision?',
];

type QueryResponse = ReturnType<typeof aiQueryResponseSchema.parse>;

export function AssistantPage() {
  useDocumentTitle('AI Research Assistant — GCC Atlas');
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(() => searchParams.get('q') ?? '');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [forceDemo, setForceDemo] = useState(false);

  const status = useQuery({
    queryKey: ['assistant-status'],
    queryFn: async () => assistantStatusSchema.parse((await api.get('/assistant/status')).data),
  });

  const answer = useQuery({
    queryKey: ['assistant-answer', submitted, forceDemo],
    queryFn: async () =>
      aiQueryResponseSchema.parse((await api.post('/assistant/query', { query: submitted, use_demo_mode: forceDemo })).data) as QueryResponse,
    enabled: Boolean(submitted),
    staleTime: Infinity,
    retry: (failureCount, error) => {
      const code = (error as { message?: string }).message ?? '';
      return failureCount < 2 && !/timed out|Failed 3 times|Network error/i.test(code);
    },
  });

  const ask = (q: string) => {
    if (q.trim().length >= 3) {
      setSubmitted(q.trim());
      if (searchParams.get('q')) setSearchParams({}, { replace: true });
    }
  };

  const providerFailed = answer.isError &&
    /provider|timeout|unreachable|malformed/i.test((answer.error as Error)?.message ?? '');

  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-teal-accent/30 bg-teal-accent/10">
            <Sparkles className="h-4 w-4 text-teal-accent" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink-100">Research Assistant</h1>
            <p className="text-xs text-ink-400">Business questions answered from a retrieved evidence pack — with citations and honest gaps.</p>
          </div>
        </div>
        {status.data ? <ModeBanner status={status.data} /> : status.isLoading ? <Spinner label="Checking assistant mode…" /> : null}
      </header>

      <Panel className="p-4">
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-end gap-2.5">
          <div className="flex-1">
            <label htmlFor="assistant-input" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Ask a business question
            </label>
            <textarea
              id="assistant-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Which city should a 150-person engineering GCC consider first: Hyderabad or Pune?"
              className="w-full resize-none rounded border border-border bg-surface-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={input.trim().length < 3 || answer.isFetching}
            className="flex items-center gap-1.5 rounded bg-teal-accent px-4 py-2.5 text-sm font-semibold text-surface-950 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" /> {answer.isFetching ? 'Researching…' : 'Ask'}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => { setInput(s); ask(s); }}
              className="rounded border border-border bg-surface-850 px-2.5 py-1 text-[11px] text-ink-300 hover:border-teal-accent/40 hover:text-ink-100">
              {s}
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-[11px] text-ink-400">
          <input type="checkbox" checked={forceDemo} onChange={(e) => setForceDemo(e.target.checked)} className="accent-[var(--color-teal-accent)]" />
          Force deterministic demo mode (skip the configured LLM)
        </label>
      </Panel>

      {submitted && answer.isFetching ? <Spinner label="Retrieving evidence and composing…" /> : null}
      {answer.isError ? (
        providerFailed ? (
          <Panel>
            <div className="flex items-start gap-3 px-5 py-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-flag" />
              <div>
                <p className="text-[13px] font-semibold text-ink-100">The AI provider failed — no answer was invented.</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-300">
                  {(answer.error as Error).message} The assistant is configured to report provider failures transparently instead of silently substituting a made-up answer.
                </p>
                <button onClick={() => answer.refetch()} className="mt-2 rounded border border-border bg-surface-800 px-3 py-1.5 text-xs text-ink-200 hover:text-ink-100">
                  Retry
                </button>
              </div>
            </div>
          </Panel>
        ) : (
          <ErrorState message={(answer.error as Error).message} onRetry={() => answer.refetch()} />
        )
      ) : null}

      {answer.data ? <AnswerResponse response={answer.data} /> : null}

      {!submitted && !answer.isFetching ? (
        <Panel>
          <PanelHeader title="How this works" subtitle="Retrieval, citations, and honest limits" />
          <ul className="space-y-2 px-5 py-4 text-xs leading-relaxed text-ink-300">
            <li className="flex gap-2"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent" /> Your question drives a bounded retrieval over tracked companies, city metrics, policies, providers, and announcements; only retrieved evidence may be cited.</li>
            <li className="flex gap-2"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent" /> Retrieved source text is treated as untrusted data, never as instructions. Cited ids are validated against the evidence pack; anything else is stripped.</li>
            <li className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent" /> Recommendations are clearly separated from facts. When evidence is insufficient, the assistant says so instead of filling the gap.</li>
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function AnswerResponse({ response }: { response: QueryResponse }) {
  const a = response.answer;
  const citeById = new Map(response.citations.map((c) => [c.source_id, c]));

  return (
    <div className="space-y-4">
      {response.insufficient_evidence ? (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-flag/30 bg-amber-flag/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-flag" />
          <p className="text-xs text-amber-flag">Insufficient evidence in the dataset — the response below is honest about that rather than filling the gaps with guesses.</p>
        </div>
      ) : null}

      <Panel>
        <PanelHeader
          title="Answer"
          right={
            <Badge tone={response.is_demo_mode ? 'amber' : 'teal'}>
              {response.is_demo_mode ? <><FlaskConical className="h-2.5 w-2.5" /> demo mode</> : <><Cpu className="h-2.5 w-2.5" /> llm mode</>} · {response.confidence} confidence
            </Badge>
          }
        />
        <div className="space-y-4 px-5 py-4">
          <p className="text-[14px] font-medium leading-relaxed text-ink-100">{a.direct_answer}</p>

          {a.key_findings.length ? (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-accent">
                <ListChecks className="h-3.5 w-3.5" /> Key findings
              </h3>
              <ul className="space-y-1.5">
                {a.key_findings.map((f, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-200">
                    <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-accent/70" /> {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {a.comparison_table && a.comparison_table.rows.length ? (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-accent">
                <Table2 className="h-3.5 w-3.5" /> Comparison
              </h3>
              <p className="mb-2 text-[11px] text-ink-400">{a.comparison_table.caption}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-[12px]">
                  <caption className="sr-only">{a.comparison_table.caption}</caption>
                  <thead>
                    <tr className="border-b border-border-strong">
                      <th scope="col" className="px-2.5 py-2 text-left font-semibold text-ink-100">Metric</th>
                      {a.comparison_table.columns.map((c, i) => (
                        <th key={i} scope="col" className="px-2.5 py-2 text-left font-semibold text-ink-100">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.comparison_table.rows.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <th scope="row" className="px-2.5 py-2 text-left text-[12px] font-normal text-ink-200">{row.label}</th>
                        {row.values.slice(0, a.comparison_table!.columns.length).map((v, j) => (
                          <td key={j} className="px-2.5 py-2 font-mono text-ink-100">
                            {v === null || v === '' ? (
                              <span className="font-sans text-[11px] italic text-ink-400" title="No verified value on file — shown as missing, not zero">
                                Not available
                              </span>
                            ) : (
                              v
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {a.evidence_facts.length ? (
            <section>
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-accent">
                <Quote className="h-3.5 w-3.5" /> Evidence-backed facts
              </h3>
              <ul className="space-y-2">
                {a.evidence_facts.map((f, i) => (
                  <li key={i} className="rounded border border-border bg-surface-850 px-3 py-2 text-[12px] leading-relaxed text-ink-200">
                    <p>{f.statement}</p>
                    {f.source_ids.length ? (
                      <p className="mt-1 flex flex-wrap gap-1">
                        {f.source_ids.map((id) => (
                          <SourceChip key={id} id={id} citation={citeById.get(id)} />
                        ))}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] italic text-ink-400">No retrieved source supports this statement — treat as unverified.</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {a.recommendations.length ? (
            <section className="rounded-md border border-amber-flag/30 bg-amber-flag/5 px-3.5 py-3">
              <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-flag">
                <Lightbulb className="h-3.5 w-3.5" /> Recommendations — separated from facts
              </h3>
              <ul className="space-y-2">
                {a.recommendations.map((r, i) => (
                  <li key={i} className="text-[13px] leading-relaxed text-ink-200">
                    {r.text}
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-ink-400">Basis: {r.basis}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {a.assumptions.length || a.missing_information.length ? (
            <section className="grid gap-4 md:grid-cols-2">
              {a.assumptions.length ? (
                <div>
                  <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">Assumptions &amp; interpretation</h3>
                  <ul className="space-y-1 text-[12px] leading-relaxed text-ink-300">
                    {a.assumptions.map((s, i) => <li key={i}>· {s}</li>)}
                  </ul>
                </div>
              ) : null}
              {a.missing_information.length ? (
                <div>
                  <h3 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                    <CircleSlash className="h-3 w-3" /> Missing information &amp; uncertainty
                  </h3>
                  <ul className="space-y-1 text-[12px] leading-relaxed text-amber-flag/90">
                    {a.missing_information.map((s, i) => <li key={i}>· {s}</li>)}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}

          {a.next_step ? (
            <section className="flex items-start gap-2 rounded-md border border-teal-accent/30 bg-teal-accent/5 px-3.5 py-2.5">
              <Compass className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
              <p className="text-[12px] leading-relaxed text-ink-200">
                <span className="font-semibold text-teal-accent">Suggested next step: </span>
                {a.next_step}
              </p>
            </section>
          ) : null}

          <p className="border-t border-border pt-2 text-[10px] text-ink-400">
            {response.retrieval
              ? `Retrieved ${response.retrieval.records_included} record(s) from the tracked dataset (${response.retrieval.evidence_sources} citable source(s)${response.retrieval.time_window_days ? `; ${response.retrieval.time_window_days}-day announcement window` : ''}).`
              : ''}{' '}
            {response.is_demo_mode
              ? 'Demo mode: composed deterministically from dataset records — not generated by an LLM.'
              : 'LLM mode: generated server-side from the retrieved evidence pack; cited ids were validated against it.'}
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`Citations (${response.citations.length})`} subtitle="Click through to verify — assistant output is an aid, not an authority" />
        {response.citations.length === 0 ? (
          <p className="px-5 py-4 text-xs text-ink-400">No external sources were used for this answer.</p>
        ) : (
          <ul className="divide-y divide-border">
            {response.citations.map((c) => (
              <li key={c.source_id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-[13px] font-medium text-ink-100">
                      {c.title}
                      {c.verification_status ? (
                        <Badge tone={c.verification_status === 'verified' ? 'teal' : c.verification_status === 'unverified' ? 'amber' : 'rose'}>
                          {c.verification_status}
                        </Badge>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] text-ink-400">{c.source_id}{c.publication_date ? ` · dated ${c.publication_date.slice(0, 10)}` : ''}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-400">{c.relevant_excerpt}</p>
                  </div>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('source_click', { kind: 'assistant_citation', ref: c.source_id })}
                    className="flex shrink-0 items-center gap-1 rounded border border-border bg-surface-800 px-2 py-1 text-[11px] text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent"
                  >
                    Open <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function SourceChip({ id, citation }: { id: string; citation?: QueryResponse['citations'][number] }) {
  const label = id.replace(/^src_/, '').replace(/_/g, ' ');
  if (citation) {
    return (
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track('source_click', { kind: 'assistant_fact', ref: id })}
        title={`${citation.title} — ${citation.url}`}
        className="rounded bg-teal-accent/10 px-1.5 py-0.5 font-mono text-[9px] text-teal-accent hover:bg-teal-accent/20"
      >
        {label}
      </a>
    );
  }
  return (
    <a href="/sources" className="rounded bg-surface-800 px-1.5 py-0.5 font-mono text-[9px] text-ink-400 hover:text-ink-200" title="Open the Sources page">
      {label}
    </a>
  );
}

function ModeBanner({ status }: { status: { ai_configured: boolean; mode: string; description: string } }) {
  if (status.ai_configured) {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-teal-accent/30 bg-teal-accent/5 px-4 py-3">
        <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-teal-accent" />
        <p className="text-xs leading-relaxed text-ink-300">{status.description}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-amber-flag/30 bg-amber-flag/10 px-4 py-3">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-flag" />
      <p className="text-xs leading-relaxed text-ink-300">
        <span className="font-semibold text-amber-flag">Deterministic demo mode.</span> {status.description}
      </p>
    </div>
  );
}
