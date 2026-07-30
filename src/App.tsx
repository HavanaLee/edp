import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { CollectionDetailPage, CollectionPage } from '@/pages/CollectionPage'
import { DataPage } from '@/pages/DataPage'
import { PipelinePage } from '@/pages/PipelinePage'
import { QcPage } from '@/pages/QcPage'
import { QcDetailPage } from '@/pages/QcDetailPage'
import { DatasetDetailPage, DatasetsPage } from '@/pages/DatasetsPage'
import { SettingsPage } from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="collection" element={<CollectionPage />} />
            <Route path="collection/:id" element={<CollectionDetailPage />} />
            <Route path="data" element={<DataPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            {/* <Route path="workers" element={<WorkersPage />} /> */}
            <Route path="qc" element={<QcPage />} />
            <Route path="qc/:id" element={<QcDetailPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="datasets/:id" element={<DatasetDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
