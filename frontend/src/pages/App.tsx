import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from './components/Shell';
import { DashboardPage } from './pages/Dashboard';
import { ExplorerPage } from './pages/Explorer';
import { CitiesPage } from './pages/Cities';
import { ProvidersPage } from './pages/Providers';
import { AssistantPage } from './pages/Assistant';
import { SourcesPage } from './pages/Sources';
import { SavedPage } from './pages/Saved';
import { NotFoundPage } from './pages/NotFound';
import { useDocumentTitle } from './hooks/useDocumentTitle';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell><DashboardPage /></Shell>,
  },
  {
    path: '/explorer',
    element: <Shell><ExplorerPage /></Shell>,
  },
  {
    path: '/cities',
    element: <Shell><CitiesPage /></Shell>,
  },
  {
    path: '/providers',
    element: <Shell><ProvidersPage /></Shell>,
  },
  {
    path: '/assistant',
    element: <Shell><AssistantPage /></Shell>,
  },
  {
    path: '/sources',
    element: <Shell><SourcesPage /></Shell>,
  },
  {
    path: '/saved',
    element: <Shell><SavedPage /></Shell>,
  },
  {
    path: '*',
    element: <Shell><NotFoundPage /></Shell>,
  },
]);

export function App() {
  useDocumentTitle('GCC Atlas — India\u2019s GCC ecosystem, made searchable');
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
