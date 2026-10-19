import { useState } from 'react';
import type * as ReactNS from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Send, AlertTriangle, Info, Quote, ExternalLink, ShieldAlert, Cpu, FlaskConical } from 'lucide-react';
import { api } from '../services/client';
import { aiQueryResponseSchema, assistantStatusSchema } from '../services/schemas';
import { Badge, Spinner, ErrorState, Panel, PanelHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const SUGGESTIONS = [
  'Compare Bengaluru and Hyderabad for a GCC expansion',
  'Where is GCC talent cheapest and deepest?',
  'Tell me about Microsoft India operations',
  'Which states have GCC policies and incentives?',
  'What are Grade-A office rents across top GCC cities?',
];

export function AssistantPage() {
  useDocumentTitle('AI Research Assistant — GCC Atlas');
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const status = useQuery({
    queryKey: ['assistant-status'],
    queryFn: async () => assistantStatusSchema.parse((await api.get('/assistant/status')).data),
  });

  const answer = useQuery({
    queryKey: ['assistant-answer', submitted],
    queryFn: async () => aiQueryResponseSchema.parse((await api.post('/assistant/query', { query: submitted, use_demo_mode: true })).data),
    enabled: Boolean(submitted),
    staleTime: Infinity,
  });

  const ask = (q: string) => {
    if (q.trim().length >= 3) setSubmitted(q.trim());
  };

  return (
    <div className="space-y-5">
      {/* Header + mode banner */}
      <header className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-teal-accent/30 bg-teal-accent/10">
            <Sparkles className="h-4 w-4 text-teal-accent" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink-100">Research Assistant</h1>
            <p className="text-xs text-ink-400">Business questions answered from the GCC Atlas dataset — with citations.</p>
          </div>
        </div>

        {status.data ? <ModeBanner status={status.data} /> : status.isLoading ? <Spinner label="Checking assistant mode…" /> : null}
      </header>

      {/* Input */}
      <Panel className="p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="flex items-end gap-2.5"
        >
          <div className="flex-1">
            <label htmlFor="assistant-input" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              Ask a business question
            </label>
            <textarea
              id="assistant-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Compare Bengaluru and Hyderabad on office costs and talent"
              className="w-full resize-none rounded border border-border bg-surface-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
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

        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => { setInput(s); ask(s); }}
              className="rounded border border-border bg-surface-850 px-2.5 py-1 text-[11px] text-ink-300 hover:border-teal-accent/40 hover:text-ink-100">
              {s}
            </button>
          ))}
        </div>
      </Panel>

      {/* Answer */}
      {submitted && answer.isFetching ? <Spinner label="Retrieving evidence from the dataset…" /> : null}
      {answer.isError ? <ErrorState message={(answer.error as Error).message} /> : null}
      {answer.data ? (
        <div className="space-y-4">
          {answer.data.insufficient_evidence ? (
            <div className="flex items-start gap-2.5 rounded-md border border-amber-flag/30 bg-amber-flag/10 px-4 py-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-flag" />
              <p className="text-xs text-amber-flag">Evidence found in the dataset was insufficient — the answer below is honest about that rather than filling gaps with guesses.</p>
            </div>
          ) : null}

          <Panel>
            <PanelHeader
              title="Answer"
              right={
                <Badge tone={answer.data.is_demo_mode ? 'amber' : 'teal'}>
                  {answer.data.is_demo_mode ? <><FlaskConical className="h-2.5 w-2.5" /> demo mode</> : <><Cpu className="h-2.5 w-2.5" /> llm mode</>} · {answer.data.confidence} confidence
                </Badge>
              }
            />
            <div className="px-5 py-4">
              <AnswerMarkdown text={answer.data.answer} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title={`Citations (${answer.data.citations.length})`} subtitle="Click through to verify — assistant output is an aid, not an authority" />
            {answer.data.citations.length === 0 ? (
              <p className="px-5 py-4 text-xs text-ink-400">No external sources were used for this answer.</p>
            ) : (
              <ul className="divide-y divide-border">
                {answer.data.citations.map((c) => (
                  <li key={c.source_id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium text-ink-100">{c.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-400">{c.relevant_excerpt}</p>
                      </div>
                      <a href={c.url} target="_blank" rel="noopener noreferrer" className="flex shrink-0 items-center gap-1 rounded border border-border bg-surface-800 px-2 py-1 text-[11px] text-ink-200 hover:border-teal-accent/40 hover:text-teal-accent">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}

      {!submitted && !answer.isFetching ? (
        <Panel>
          <PanelHeader title="How this works" subtitle="Retrieval, citations, and honest limits" />
          <ul className="space-y-2 px-5 py-4 text-xs leading-relaxed text-ink-300">
            <li className="flex gap-2"><Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent" /> Answers are grounded in GCC Atlas records — companies, city metrics, policies, announcements — each with source provenance.</li>
            <li className="flex gap-2"><ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent" /> When the dataset cannot support an answer, the assistant says so explicitly instead of inventing figures.</li>
            <li className="flex gap-2"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-accent" /> Facts, recommendations, and assumptions are kept separate; numeric metrics are flagged as estimates with confidence levels.</li>
          </ul>
        </Panel>
      ) : null}
    </div>
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

/** Renders the assistant's markdown-lite answer (headings, tables, lists, emphasis) */
function AnswerMarkdown({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-ink-200">
      {(() => {
        const out: ReactNS.ReactElement[] = [];
        let i = 0;
        let keyIdx = 0;
        while (i < lines.length) {
          const line = lines[i]!;
          if (line.startsWith('|')) {
            const run: string[] = [];
            while (i < lines.length && lines[i]!.startsWith('|')) {
              run.push(lines[i]!);
              i++;
            }
            out.push(<InlineTable key={`t${keyIdx++}`} lineRun={run} />);
            continue;
          }
          const key = `l${keyIdx++}`;
          if (line.trim() === '') { i++; continue; }
          if (line.startsWith('### ')) {
            out.push(<h3 key={key} className="mt-4 text-[13px] font-semibold uppercase tracking-wider text-teal-accent">{inline(line.slice(4))}</h3>);
          } else if (line.startsWith('- ')) {
            out.push(<li key={key} className="ml-4 list-disc text-[13px] text-ink-300">{inline(line.slice(2))}</li>);
          } else if (line.startsWith('_') && line.endsWith('_')) {
            out.push(<p key={key} className="text-[11px] italic text-ink-400">{inline(line.slice(1, -1))}</p>);
          } else if (line.startsWith('> ')) {
            out.push(
              <div key={key} className="rounded border border-amber-flag/30 bg-amber-flag/10 px-3 py-2 text-[12px] text-amber-flag">
                {inline(line.slice(2))}
              </div>,
            );
          } else if (line === '---') {
            out.push(<hr key={key} className="border-border" />);
          } else {
            out.push(<p key={key}>{inline(line)}</p>);
          }
          i++;
        }
        return out;
      })()}
    </div>
  );
}

function InlineTable({ lineRun }: { lineRun: string[] }) {
  if (lineRun.length < 2) return null;
  const split = (l: string) => l.split('|').slice(1, -1).map((s) => s.trim());
  const headers = split(lineRun[0]!);
  const isSeparator = split(lineRun[1] ?? '').every((s) => /^-+$/.test(s));
  const bodyStart = isSeparator ? 2 : 1;
  const rows = lineRun.slice(bodyStart).map(split);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-border-strong">
            {headers.map((h, i) => (
              <th key={i} className="px-2.5 py-2 text-left font-semibold text-ink-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-0">
              {row.map((cell, j) => (
                <td key={j} className={`px-2.5 py-2 ${j === 0 ? 'text-ink-200' : 'font-mono text-ink-100'}`}>{inline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inline(text: string): string {
  // Bold segments
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    // eslint-disable-next-line no-undef
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink-100">$1</strong>')
    .replace(/(?:^| )\[src:([a-z0-9_]+)\]/gi, '<span class="ml-1 rounded bg-surface-800 px-1 py-0.5 font-mono text-[9px] text-ink-400">src:$1</span>');
}
