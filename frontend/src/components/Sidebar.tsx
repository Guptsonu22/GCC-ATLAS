import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Handshake,
  Sparkles,
  Database,
  Bookmark,
  Compass,
  Scale,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAppShell } from '../context/AppShellContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explorer', label: 'GCC Explorer', icon: Building2 },
  { to: '/cities', label: 'City Intelligence', icon: MapPin },
  { to: '/compare', label: 'Compare Workspace', icon: Scale },
  { to: '/providers', label: 'Providers', icon: Handshake },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/sources', label: 'Sources', icon: Database },
  { to: '/saved', label: 'Saved', icon: Bookmark },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useAppShell();
  const collapsed = sidebarCollapsed && !onNavigate ? sidebarCollapsed : false;

  return (
    <nav aria-label="Primary" className="flex h-full flex-col border-r border-border bg-surface-900">
      {collapsed ? (
        <div className="flex flex-col items-center border-b border-border py-4">
          <Link to="/" onClick={onNavigate} aria-label="GCC Atlas home" className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-teal-accent/30 bg-teal-accent/10">
            <Compass className="h-4 w-4 text-teal-accent" strokeWidth={1.75} />
          </Link>
          <button
            onClick={toggleSidebarCollapsed}
            aria-label="Expand sidebar"
            aria-expanded="true"
            className="mt-3 rounded p-1.5 text-ink-400 hover:bg-surface-800 hover:text-ink-200"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 border-b border-border px-5 py-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-teal-accent/30 bg-teal-accent/10">
            <Compass className="h-4 w-4 text-teal-accent" strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight text-ink-100">GCC Atlas</span>
            <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-ink-400">
              India's GCC ecosystem, searchable
            </span>
          </span>
        </Link>
      )}

      <ul className={`flex-1 space-y-0.5 ${collapsed ? 'p-1.5' : 'p-2'}`}>
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? label : undefined}
                className={`flex items-center rounded text-[13px] transition-colors ${
                  collapsed
                    ? `justify-center p-2.5 ${active ? 'bg-surface-800 text-ink-100' : 'text-ink-300 hover:bg-surface-850 hover:text-ink-200'}`
                    : `gap-2.5 px-3 py-2 ${active ? 'bg-surface-800 font-medium text-ink-100 shadow-[inset_2px_0_0_0_var(--color-teal-accent)]' : 'text-ink-300 hover:bg-surface-850 hover:text-ink-200'}`
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {collapsed ? <span className="sr-only">{label}</span> : label}
              </Link>
            </li>
          );
        })}
      </ul>

      {!collapsed ? (
        <div className="border-t border-border p-4">
          <button
            onClick={toggleSidebarCollapsed}
            aria-label="Collapse sidebar"
            aria-expanded="false"
            className="mb-3 flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-ink-400 hover:bg-surface-850 hover:text-ink-200"
          >
            <PanelLeftClose className="h-3.5 w-3.5" /> Collapse
          </button>
          <p className="text-[10px] leading-relaxed text-ink-400">
            Prototype — demonstrated with a tracked dataset of real GCC records.
            Figures marked “estimate” are indicative and must be verified before decisions.
          </p>
        </div>
      ) : null}
    </nav>
  );
}
