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
} from 'lucide-react';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explorer', label: 'GCC Explorer', icon: Building2 },
  { to: '/cities', label: 'City Intelligence', icon: MapPin },
  { to: '/providers', label: 'Providers', icon: Handshake },
  { to: '/assistant', label: 'AI Assistant', icon: Sparkles },
  { to: '/sources', label: 'Sources', icon: Database },
  { to: '/saved', label: 'Saved', icon: Bookmark },
];

export function Sidebar() {
  const location = useLocation();
  return (
    <nav aria-label="Primary" className="flex h-full flex-col border-r border-border bg-surface-900">
      <Link to="/" className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-teal-accent/30 bg-teal-accent/10">
          <Compass className="h-4.5 w-4.5 text-teal-accent" strokeWidth={1.75} />
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-tight text-ink-100">GCC Atlas</span>
          <span className="block text-[10px] uppercase tracking-[0.14em] text-ink-400">
            India's GCC ecosystem, made searchable
          </span>
        </span>
      </Link>
      <ul className="flex-1 space-y-0.5 p-2">
        {NAV.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded px-3 py-2 text-[13px] transition-colors ${
                  active
                    ? 'bg-surface-800 font-medium text-ink-100 shadow-[inset_2px_0_0_0_var(--color-teal-accent)]'
                    : 'text-ink-300 hover:bg-surface-850 hover:text-ink-200'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-border p-4">
        <p className="text-[10px] leading-relaxed text-ink-400">
          Prototype — demonstrated with a tracked dataset of real GCC records.
          Figures marked “estimate” are indicative and must be verified before decisions.
        </p>
      </div>
    </nav>
  );
}
