import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCollectionTask, getCollectionTasks } from '@/api/client'
import { Badge, Card, EmptyState, LoadingBlock, PageHeader, ProgressBar } from '@/components/ui'
import { statusLabel } from '@/lib/utils'

export function CollectionPage() {
  const q = useQuery({ queryKey: ['collection'], queryFn: getCollectionTasks })
  if (q.isLoading) return <LoadingBlock />

  return (
    <div>
      <PageHeader title="数据采集" subtitle="采集端 App 任务领取 / 提交 · 切片进度跟踪" />
      <div className="overflow-hidden rounded-xl border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-panel)] text-xs text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">任务 ID</th>
              <th className="px-4 py-3">标题</th>
              <th className="px-4 py-3">场景</th>
              <th className="px-4 py-3">操作员</th>
              <th className="px-4 py-3">设备</th>
              <th className="px-4 py-3">状态</th>
              <th className="px-4 py-3">进度</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((t) => (
              <tr key={t.id} className="border-t border-[var(--border)] hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link className="text-[var(--accent)]" to={`/collection/${t.id}`}>
                    {t.id}
                  </Link>
                </td>
                <td className="px-4 py-3">{t.title}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{t.sceneLabel}</td>
                <td className="px-4 py-3">{t.operator}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{t.deviceSn}</td>
                <td className="px-4 py-3">
                  <Badge tone={t.status === 'failed' ? 'danger' : t.status === 'done' ? 'success' : 'info'}>
                    {statusLabel[t.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 w-40">
                  <div className="mb-1 text-[11px] text-[var(--text-muted)]">
                    {t.sliceDone}/{t.sliceTotal}
                  </div>
                  <ProgressBar value={(t.sliceDone / t.sliceTotal) * 100} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CollectionDetailPage() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: ['collection', id], queryFn: () => getCollectionTask(id) })
  if (q.isLoading) return <LoadingBlock />
  if (!q.data) return <EmptyState text="未找到该采集任务" />
  const t = q.data

  return (
    <div>
      <PageHeader
        title={t.id}
        subtitle={t.title}
        actions={
          <Link to="/collection" className="text-sm text-[var(--accent)]">
            ← 返回列表
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="基本信息">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">场景</dt><dd>{t.sceneLabel}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">操作员</dt><dd>{t.operator}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">设备 SN</dt><dd>{t.deviceSn}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">状态</dt><dd><Badge tone="info">{statusLabel[t.status]}</Badge></dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">更新时间</dt><dd>{t.updatedAt}</dd></div>
          </dl>
        </Card>
        <Card title="切片进度">
          <div className="mb-2 text-3xl font-semibold">
            {t.sliceDone}/{t.sliceTotal}
          </div>
          <ProgressBar value={(t.sliceDone / t.sliceTotal) * 100} />
          <p className="mt-3 text-xs text-[var(--text-muted)]">完成后自动进入解析 / Tag / 预标流水线（Mock）。</p>
        </Card>
      </div>
    </div>
  )
}
