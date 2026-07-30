import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getDataset, getDatasets } from '@/api/client'
import { Badge, Card, EmptyState, LoadingBlock, PageHeader } from '@/components/ui'
import { formatNumber, statusLabel } from '@/lib/utils'

export function DatasetsPage() {
  const q = useQuery({ queryKey: ['datasets'], queryFn: getDatasets })
  if (q.isLoading) return <LoadingBlock />

  return (
    <div>
      <PageHeader
        title="LeRobot 交付"
        subtitle="对接本地 black_pen / black_mouse 两个数据集元信息"
      />
      <div className="grid gap-3 md:grid-cols-2">
        {(q.data ?? []).map((d) => (
          <Card key={d.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold">{d.name}</div>
              <Badge tone={d.qcStatus === 'passed' ? 'success' : 'warn'}>{statusLabel[d.qcStatus]}</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{d.task}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--text-muted)]">
              <div>版本：{d.version}</div>
              <div>机器人：{d.robotType}</div>
              <div>Episodes：{d.episodes}</div>
              <div>Frames：{formatNumber(d.frames)}</div>
              <div>Videos：{d.videos}</div>
              <div>FPS：{d.fps}</div>
            </div>
            <div className="mt-4">
              <Link to={`/datasets/${d.id}`} className="text-sm text-[var(--accent)]">
                查看详情 →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function DatasetDetailPage() {
  const { id = '' } = useParams()
  const q = useQuery({ queryKey: ['datasets', id], queryFn: () => getDataset(id) })
  if (q.isLoading) return <LoadingBlock />
  if (!q.data) return <EmptyState text="未找到数据集" />
  const d = q.data

  return (
    <div>
      <PageHeader
        title={d.name}
        subtitle={d.task}
        actions={
          <Link to="/datasets" className="text-sm text-[var(--accent)]">
            ← 返回
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="meta/info.json 摘要">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">codebase_version</dt><dd>{d.version}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">robot_type</dt><dd>{d.robotType}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">total_episodes</dt><dd>{d.episodes}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">total_frames</dt><dd>{formatNumber(d.frames)}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">total_videos</dt><dd>{d.videos}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--text-muted)]">fps</dt><dd>{d.fps}</dd></div>
          </dl>
        </Card>
        <Card title="本地路径与相机">
          <p className="text-sm break-all">{d.path}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--text-muted)]">
            <li>observation.images.cam_high</li>
            <li>observation.images.cam_left</li>
            <li>observation.images.cam_right</li>
            <li>data/chunk-000/episode_000000.parquet ~ episode_000019.parquet</li>
          </ul>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            想看视频：用资源管理器打开 `videos/chunk-000/.../episode_*.mp4`。二期可在此页嵌入 MultiCamPlayer。
          </p>
        </Card>
      </div>
    </div>
  )
}
