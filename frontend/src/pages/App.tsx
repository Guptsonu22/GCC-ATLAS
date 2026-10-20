import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shell } from '../components/Shell';
import { AppShellProvider } from '../context/AppShellContext';
import { DashboardPage } from './Dashboard';
import { ExplorerPage } from './Explorer';
import { CompanyDetailPage } from './CompanyDetail';
import { CitiesPage } from './Cities';
import { CompareWorkspacePage } from './CompareWorkspace';
import { ProvidersPage } from './Providers';
import { AssistantPage } from './Assistant';
import { SourcesPage } from './Sources';
import { SavedPage } from './Saved';
import { NotFoundPage } from './NotFound';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

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
    path: '/companies/:companyId',
    element: <Shell><CompanyDetailPage /></Shell>,
  },
  {
    path: '/cities',
    element: <Shell><CitiesPage /></Shell>,
  },
  {
    path: '/compare',
    element: <Shell><CompareWorkspacePage /></Shell>,
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
      <AppShellProvider>
        <RouterProvider router={router} />
      </AppShellProvider>
    </QueryClientProvider>
  );
}
