import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  getCollectionTasks,
  getEvents,
  getFunnel,
  getOperatorLatency,
  getQualityDist,
  getSceneStats,
  getSummary,
  getTimeseries,
  getWorkers,
} from '@/api/client'
import { Badge, Card, KpiCard, LoadingBlock, PageHeader, ProgressBar } from '@/components/ui'
import { formatNumber, pct, statusLabel } from '@/lib/utils'

export function DashboardPage() {
  const summaryQ = useQuery({ queryKey: ['summary'], queryFn: getSummary, refetchInterval: 5000 })
  const funnelQ = useQuery({ queryKey: ['funnel'], queryFn: getFunnel })
  const tsQ = useQuery({ queryKey: ['timeseries'], queryFn: getTimeseries })
  const qualityQ = useQuery({ queryKey: ['quality'], queryFn: getQualityDist })
  const sceneQ = useQuery({ queryKey: ['scenes'], queryFn: getSceneStats })
  const eventsQ = useQuery({ queryKey: ['events'], queryFn: getEvents, refetchInterval: 3000 })
  const latencyQ = useQuery({ queryKey: ['latency'], queryFn: getOperatorLatency })
  const workersQ = useQuery({ queryKey: ['workers'], queryFn: getWorkers, refetchInterval: 5000 })
  const tasksQ = useQuery({ queryKey: ['collection'], queryFn: getCollectionTasks })

  if (summaryQ.isLoading || !summaryQ.data) return <LoadingBlock />
  const s = summaryQ.data

  return (
    <div>
      <PageHeader
        title="平台总览"
        subtitle={`原始采集 → 切分 → 解析 → 语音Tag → 3D预标 → 外参 → 后处理 → LeRobot交付 → 质检 · ${s.dateLabel}`}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="今日上传切片"
          value={s.todayUploads}
          hint={`5min/片 · 共 ${s.todayMinutes} min · 较昨日 +${s.uploadDeltaPct}%`}
          accent="var(--info)"
        />
        <KpiCard
          label="算子运行中"
          value={s.workersRunning}
          hint={`排队 ${s.queueDepth} 个 · Celery ${s.workersOnline}`}
          accent="var(--warning)"
        />
        <KpiCard
          label="GPU 池利用率"
          value={pct(s.gpuUtil)}
          hint={`${s.gpuPool} · HaMeR / ASR / 外参 共用`}
          accent="var(--accent)"
        />
        <KpiCard
          label="质检通过率"
          value={pct(s.qcPassRate)}
          hint={`${s.qcPassed} 通过 / ${s.qcPending} 待检 · 高质量 ${pct(s.highQualityPct)}`}
          accent="var(--success)"
        />
        <KpiCard
          label="已交付数据包"
          value={s.deliveredPackages}
          hint={`LeRobot v2.1/v3.0 · 失败任务 ${s.failedJobs} 个待处理`}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="全链路数据漏斗" className="xl:col-span-2" extra={<Link className="text-xs text-[var(--accent)]" to="/data">进入数据管理</Link>}>
          <div className="space-y-2">
            {(funnelQ.data ?? []).map((item) => {
              const max = funnelQ.data?.[0]?.total || 1
              return (
                <div key={item.stage} className="grid grid-cols-[110px_1fr_90px] items-center gap-3 text-sm">
                  <div className="text-[var(--text-muted)]">{item.label}</div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                      style={{ width: `${(item.total / max) * 100}%` }}
                    />
                  </div>
                  <div className="text-right text-xs">
                    {item.total}
                    <span className="text-[var(--text-muted)]">（{item.inStock} 在库）</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="质检质量分布">
          {qualityQ.data && (
            <div className="space-y-3 text-sm">
              {[
                ['高质量', qualityQ.data.high, 'var(--success)'],
                ['中质量', qualityQ.data.medium, 'var(--info)'],
                ['低质量/驳回', qualityQ.data.low, 'var(--danger)'],
                ['待质检', qualityQ.data.pending, 'var(--warning)'],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">{label}</span>
                  <span className="text-lg font-semibold" style={{ color: String(color) }}>
                    {value as number}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="近 7 日数据流转" className="xl:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tsQ.data ?? []}>
                <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#8b9bb8" fontSize={12} />
                <YAxis stroke="#8b9bb8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid #243044' }} />
                <Legend />
                <Line type="monotone" dataKey="uploads" name="上传切片" stroke="#38bdf8" strokeWidth={2} />
                <Line type="monotone" dataKey="parsed" name="完成解析" stroke="#a78bfa" strokeWidth={2} />
                <Line type="monotone" dataKey="delivered" name="完成交付" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="场景数据分布" extra={<span className="text-[11px] text-[var(--text-muted)]">GET /collection/tasks/stats</span>}>
          <div className="space-y-2">
            {(sceneQ.data ?? []).map((item) => (
              <div key={item.scene} className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">{item.label}</span>
                <Badge tone="info">{item.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card
          title="GPU Worker 实时监控"
          className="xl:col-span-2"
          extra={<span className="text-[11px] text-[var(--text-muted)]">K8s + GPU Share · 心跳 2s</span>}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(workersQ.data ?? []).map((w) => (
              <div key={w.name} className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3">
                <div className="truncate text-xs font-medium">{w.name}</div>
                <div className="mt-1 text-[11px] text-[var(--text-muted)]">{w.roleLabel}</div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <Badge tone={w.status === 'busy' ? 'warn' : 'success'}>{statusLabel[w.status]}</Badge>
                  <span className="text-[var(--text-muted)]">
                    {Math.round(w.gpuUtil * 100)}% · {w.memGb}GB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="链路事件流" extra={<Badge tone="success">实时</Badge>}>
          <div className="max-h-80 space-y-2 overflow-auto pr-1">
            {(eventsQ.data ?? []).map((e) => (
              <div key={e.id} className="rounded-md border border-[var(--border)] bg-[var(--bg-panel)] px-2 py-2 text-xs">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[var(--text-muted)]">{e.time}</span>
                  <Badge tone={e.level === 'warn' ? 'warn' : e.level === 'success' ? 'success' : 'info'}>
                    {e.level}
                  </Badge>
                </div>
                <div className="leading-relaxed">{e.message}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link to="/pipeline" className="text-xs text-[var(--accent)]">
              查看生产任务 →
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card title="算子单任务耗时" className="xl:col-span-2" extra={<span className="text-[11px] text-[var(--text-muted)]">avg / p95（分钟，5min 视频）</span>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyQ.data ?? []}>
                <CartesianGrid stroke="#243044" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#8b9bb8" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#8b9bb8" fontSize={12} />
                <Tooltip contentStyle={{ background: '#121826', border: '1px solid #243044' }} />
                <Legend />
                <Bar dataKey="avgMin" name="平均" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="p95Min" name="P95" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="进行中的采集任务" extra={<Link className="text-xs text-[var(--accent)]" to="/collection">全部任务</Link>}>
          <div className="space-y-3">
            {(tasksQ.data ?? []).map((t) => (
              <Link
                key={t.id}
                to={`/collection/${t.id}`}
                className="block rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3 transition hover:border-[var(--accent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{t.id}</div>
                  <Badge
                    tone={
                      t.status === 'recording'
                        ? 'danger'
                        : t.status === 'uploading'
                          ? 'warn'
                          : t.status === 'processing'
                            ? 'info'
                            : 'success'
                    }
                  >
                    {statusLabel[t.status]}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {t.title} · {t.operator} · {t.deviceSn}
                </div>
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-[11px] text-[var(--text-muted)]">
                    <span>
                      切片 {t.sliceDone}/{t.sliceTotal}
                    </span>
                    <span>{Math.round((t.sliceDone / t.sliceTotal) * 100)}%</span>
                  </div>
                  <ProgressBar value={(t.sliceDone / t.sliceTotal) * 100} />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <p className="mt-4 text-center text-[11px] text-[var(--text-muted)]">
        演示数据对标 EDP · 帧数合计 {formatNumber(15668 + 16423)} · 本地已接入 pen/mouse 两个 LeRobot 包元信息
      </p>
    </div>
  )
}
