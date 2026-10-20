import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AppShellState {
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
}

const AppShellContext = createContext<AppShellState | null>(null);

const COLLAPSE_KEY = 'gcc-atlas-sidebar-collapsed';

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSidebarCollapsed = () => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1');
      } catch {
        /* localStorage unavailable — remember for this session only */
      }
      return !prev;
    });
  };

  // Global keyboard shortcut: Ctrl/Cmd+K opens search, Escape closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <AppShellContext.Provider
      value={{ sidebarCollapsed: collapsed, toggleSidebarCollapsed, searchOpen, setSearchOpen }}
    >
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell(): AppShellState {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('useAppShell must be used inside AppShellProvider');
  return ctx;
}
