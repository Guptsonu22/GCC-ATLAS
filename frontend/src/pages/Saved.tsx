import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Check, X, Bookmark } from 'lucide-react';
import { z } from 'zod';
import { api } from '../services/client';
import { savedResearchSchema, cityDetailSchema } from '../services/schemas';
import type { SavedResearch } from '../services/schemas';
import { Panel, Badge, Spinner, ErrorState, EmptyState, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const listSchema = z.array(savedResearchSchema);
const savedListSchema = z.object({ data: listSchema });
const compareSchema = z.object({ data: z.array(cityDetailSchema) });

const METRIC_LABELS: Record<string, string> = {
  gcc_count_estimated: 'Est. GCC count',
  tech_talent_pool_estimated: 'Tech talent pool',
  office_rent_grade_a: 'Grade-A rent',
  metro_rail_km_operational: 'Metro km',
  senior_engineer_total_comp: 'Sr. eng comp',
  entry_engineer_total_comp: 'Entry comp',
};

export function SavedPage() {
  useDocumentTitle('Saved research — GCC Atlas');
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [openItemId, setOpenItemId] = useState<string | null>(null);


  const saved = useQuery({
    queryKey: ['saved-research'],
    queryFn: async () => savedListSchema.parse((await api.get('/saved-research')).data).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['saved-research'] });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post('/saved-research', {
        name: name.trim() || `City comparison ${new Date().toISOString().slice(0, 10)}`,
        type: 'city_comparison',
        data: { ids: ['loc_bengaluru', 'loc_hyderabad'], note: 'Default starter comparison — edit via API or rename.' },
      }),
    onSuccess: () => {
      setName('');
      invalidate();
    },
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => api.patch(`/saved-research/${id}`, { name }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/saved-research/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Saved Research"
        title="Your comparisons and research items"
        description="Create, rename, revisit and delete saved city comparisons. Items are persisted server-side in the GCC Atlas database (prototype uses a single shared user space)."
      />

      <Panel className="p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
          className="flex items-center gap-2.5"
        >
          <div className="flex-1">
            <label htmlFor="saved-name" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              New saved comparison name
            </label>
            <input
              id="saved-name"

              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BLR vs HYD vs PUNE — Q4 review"
              className="w-full rounded border border-border bg-surface-950 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-teal-accent/50"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-1.5 rounded bg-teal-accent px-4 py-2.5 text-sm font-semibold text-surface-950 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" /> Save item
          </button>
        </form>
        <p className="mt-2 text-[11px] text-ink-400">
          The prototype creates a starter Bengaluru–Hyderabad comparison which you can rename or delete; the full builder (custom city picklists on save) is on the roadmap.
        </p>
        {createMutation.isError ? <p className="mt-1.5 text-[11px] text-rose-flag">{(createMutation.error as Error).message}</p> : null}
      </Panel>

      {saved.isLoading ? (
        <Spinner label="Loading saved items…" />
      ) : saved.isError ? (
        <ErrorState message={(saved.error as Error).message} onRetry={() => saved.refetch()} />
      ) : saved.data!.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing saved yet"
            hint="Create a comparison above, or save one from the City Intelligence page later in the roadmap."
          />
        </Panel>
      ) : (
        <div className="space-y-3">
          {saved.data!.map((item) => (
            <SavedItem
              key={item.id}
              item={item}
              open={openItemId === item.id}
              onToggle={() => setOpenItemId((cur) => (cur === item.id ? null : item.id))}
              editing={editingId === item.id}
              onEditStart={() => { setEditingId(item.id); setEditName(item.name); }}
              onEditCancel={() => setEditingId(null)}
              onEditSave={() => renameMutation.mutate({ id: item.id, name: editName })}
              editName={editName}
              setEditName={setEditName}
              onDelete={() => deleteMutation.mutate(item.id)}
              busy={renameMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SavedItem({
  item, open, onToggle, editing, onEditStart, onEditCancel, onEditSave, editName, setEditName, onDelete, busy,
}: {
  item: SavedResearch;
  open: boolean;
  onToggle: () => void;
  editing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  editName: string;
  setEditName: (v: string) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <Panel>
      <div className="flex items-center gap-3 px-5 py-3">
        <Bookmark className={`h-4 w-4 shrink-0 ${open ? 'text-teal-accent' : 'text-ink-400'}`} />
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              aria-label="Rename saved item"
              className="w-full rounded border border-teal-accent/40 bg-surface-950 px-2.5 py-1.5 text-sm text-ink-100"
              onKeyDown={(e) => { if (e.key === 'Enter') onEditSave(); if (e.key === 'Escape') onEditCancel(); }}
              autoFocus
            />
            <button onClick={onEditSave} disabled={busy || editName.trim().length === 0} aria-label="Save rename" className="rounded border border-teal-accent/40 bg-teal-accent/10 p-1.5 text-teal-accent hover:bg-teal-accent/20 disabled:opacity-40">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={onEditCancel} aria-label="Cancel rename" className="rounded border border-border p-1.5 text-ink-300 hover:text-ink-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={onToggle} className="min-w-0 flex-1 text-left" aria-expanded={open}>
            <span className="block truncate text-[14px] font-semibold text-ink-100">{item.name}</span>
            <span className="text-[11px] text-ink-400">
              {item.type.replace(/_/g, ' ')} · created {item.created_at.slice(0, 10)}
            </span>
          </button>
        )}
        {!editing ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={onEditStart} aria-label={`Rename ${item.name}`} className="rounded border border-border p-1.5 text-ink-300 hover:text-ink-100 hover:border-border-strong">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={onDelete} disabled={busy} aria-label={`Delete ${item.name}`} className="rounded border border-rose-flag/30 p-1.5 text-rose-flag hover:bg-rose-flag/10 disabled:opacity-40">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
      {open ? <SavedItemDetail item={item} /> : null}
      <SavedItemFooter itemId={item.id} open={open} />
    </Panel>
  );
}

function SavedItemDetail({ item }: { item: SavedResearch }) {
  const detail = useQuery({
    queryKey: ['saved-item-data', item.id, item.data],
    queryFn: async () => {
      const parsed = JSON.parse(item.data) as { ids?: string[] };
      const ids = parsed.ids ?? [];
      if (ids.length === 0) return null;
      return compareSchema.parse((await api.get('/cities/compare', { params: { ids: ids.join(',') } })).data).data;
    },
    enabled: item.type === 'city_comparison',
  });

  if (item.type !== 'city_comparison') {
    return <p className="text-xs text-ink-400">Details for this item type are not visualized yet.</p>;
  }

  return (
    <div className="border-t border-border px-5 py-4">
      {detail.isLoading ? <Spinner label="Loading comparison…" /> : null}
      {detail.isError ? <ErrorState message={(detail.error as Error).message} /> : null}
      {detail.data && detail.data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border-strong">
                <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-ink-400">Metric</th>
                {detail.data.map((city) => (
                  <th key={city.id} className="px-2.5 py-2 text-left text-[12px] font-semibold text-ink-100">{city.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['gcc_count_estimated', 'tech_talent_pool_estimated', 'office_rent_grade_a', 'metro_rail_km_operational', 'senior_engineer_total_comp'].map((metricName) => (
                <tr key={metricName} className="border-b border-border last:border-0">
                  <td className="px-2.5 py-2 text-ink-200">{METRIC_LABELS[metricName] ?? metricName}</td>
                  {detail.data!.map((city) => {
                    const m = (city.metrics ?? []).find((x) => x.metric_name === metricName);
                    return (
                      <td key={city.id} className="px-2.5 py-2 font-mono text-ink-100">
                        {m && m.metric_value !== null ? `${m.metric_value.toLocaleString('en-IN')}` : 'Not available'}
                        {m && m.is_estimate === 1 ? <Badge tone="amber" className="ml-1">est</Badge> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !detail.isLoading && !detail.isError ? (
        <p className="text-xs text-ink-400">No comparison data stored for this item.</p>
      ) : null}
    </div>
  );
}

function SavedItemFooter({ itemId, open }: { itemId: string; open: boolean }) {
  const data = useQuery({
    queryKey: ['saved-item-raw', itemId],
    queryFn: async () => JSON.parse(
      (await api.get('/saved-research')).data.data.find((x: SavedResearch) => x.id === itemId)?.data ?? '{}',
    ) as { ids?: string[]; note?: string },
    enabled: open,
  });
  if (!open) return null;
  return (
    <div className="border-t border-border px-5 py-2.5">
      <p className="text-[10px] text-ink-400">
        Stored payload: {data.data?.ids ? `${data.data.ids.length} cities (${data.data.ids.map((i) => i.replace('loc_', '')).join(', ')})` : 'custom'}
        {data.data?.note ? ` — ${data.data.note}` : ''}
      </p>
    </div>
  );
}
