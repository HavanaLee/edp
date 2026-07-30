import { useQuery } from '@tanstack/react-query'
import { getWorkers } from '@/api/client'
import { Badge, Card, LoadingBlock, PageHeader } from '@/components/ui'
import { statusLabel } from '@/lib/utils'

export function WorkersPage() {
  const q = useQuery({ queryKey: ['workers'], queryFn: getWorkers, refetchInterval: 3000 })
  if (q.isLoading) return <LoadingBlock />

  const grouped = (q.data ?? []).reduce<Record<string, typeof q.data>>((acc, w) => {
    acc[w.roleLabel] = acc[w.roleLabel] ?? []
    acc[w.roleLabel]!.push(w)
    return acc
  }, {})

  return (
    <div>
      <PageHeader title="GPU Worker" subtitle="K8s + GPU Share (MIG/MPS) · 心跳模拟 2–3s 刷新" />
      <div className="space-y-5">
        {Object.entries(grouped).map(([role, list]) => (
          <Card key={role} title={role}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(list ?? []).map((w) => (
                <div key={w.name} className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
                  <div className="text-sm font-medium">{w.name}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <Badge tone={w.status === 'busy' ? 'warn' : w.status === 'offline' ? 'danger' : 'success'}>
                      {statusLabel[w.status]}
                    </Badge>
                    <span className="text-[var(--text-muted)]">
                      GPU {Math.round(w.gpuUtil * 100)}% · {w.memGb}GB
                    </span>
                  </div>
                  {w.currentJobId ? (
                    <div className="mt-2 text-[11px] text-[var(--accent)]">任务 {w.currentJobId}</div>
                  ) : (
                    <div className="mt-2 text-[11px] text-[var(--text-muted)]">空闲</div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
