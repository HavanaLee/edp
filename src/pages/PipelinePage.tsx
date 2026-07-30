import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getJobs, retryJob } from '@/api/client'
import { Badge, LoadingBlock, PageHeader } from '@/components/ui'
import { statusLabel } from '@/lib/utils'

export function PipelinePage() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['jobs'], queryFn: getJobs, refetchInterval: 4000 })
  const retryM = useMutation({
    mutationFn: retryJob,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  if (q.isLoading) return <LoadingBlock />

  return (
    <div>
      <PageHeader title="生产任务" subtitle="Celery Job 队列 · 失败可重试（Mock）" />
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-panel)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Job ID</th>
              <th className="px-4 py-3">切片</th>
              <th className="px-4 py-3">算子</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">进度</th>
              <th className="px-4 py-3">错误</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((j) => (
              <tr key={j.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-3 font-mono text-xs">{j.id}</td>
                <td className="px-4 py-3">{j.sliceId}</td>
                <td className="px-4 py-3">{j.operator}</td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      j.status === 'failed'
                        ? 'danger'
                        : j.status === 'success'
                          ? 'success'
                          : j.status === 'running'
                            ? 'warn'
                            : 'neutral'
                    }
                  >
                    {statusLabel[j.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">{j.progress}%</td>
                <td className="px-4 py-3 text-xs text-rose-300">{j.error ?? '—'}</td>
                <td className="px-4 py-3">
                  {j.status === 'failed' ? (
                    <button
                      type="button"
                      className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent)]"
                      onClick={() => retryM.mutate(j.id)}
                    >
                      重试
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
