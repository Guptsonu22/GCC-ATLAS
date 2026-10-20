import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { useAppShell } from '../context/AppShellContext';

export function Shell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { setSearchOpen } = useAppShell();
  const mainRef = useRef<HTMLElement>(null);

  // Close the mobile drawer when the viewport grows past lg.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const listener = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Ctrl/Cmd+K anywhere opens the global search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  return (
    <div className="flex min-h-screen bg-surface-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-teal-accent focus:px-3 focus:py-1.5 focus:text-xs focus:font-semibold focus:text-surface-950"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar (collapsible) */}
      <DesktopSidebar />

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-64 bg-surface-900">
            <button
              className="absolute right-2 top-2 z-10 rounded p-1.5 text-ink-300 hover:bg-surface-800 hover:text-ink-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {/* Compact top bar — mobile menu, search trigger, visible at every breakpoint */}
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-surface-900/90 px-3 py-2 backdrop-blur sm:px-4">
          <button
            className="rounded border border-border bg-surface-800 p-1.5 text-ink-200 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search companies, cities, providers and policies"
            aria-keyshortcuts="Control+K"
            className="flex flex-1 items-center gap-2 rounded border border-border bg-surface-950 px-3 py-1.5 text-left text-xs text-ink-400 transition-colors hover:border-border-strong hover:text-ink-300 sm:max-w-md"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden>
              <circle cx="6" cy="6" r="4.5" strokeWidth="1.5" />
              <path d="m10 10 3 3" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="flex-1 truncate">Search GCC records…</span>
            <kbd className="hidden rounded border border-border bg-surface-800 px-1 font-mono text-[9px] uppercase text-ink-400 sm:inline">
              Ctrl K
            </kbd>
          </button>
        </header>

        <main id="main-content" ref={mainRef} tabIndex={-1} className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <GlobalSearch />
    </div>
  );
}

function DesktopSidebar() {
  const { sidebarCollapsed } = useAppShell();
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 lg:block ${sidebarCollapsed ? 'w-14' : 'w-60'}`}
      aria-label="Primary navigation container"
    >
      <Sidebar onNavigate={undefined} />
    </aside>
  );
}
