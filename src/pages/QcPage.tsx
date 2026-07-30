import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getQcPackages, getQcSummary } from '@/api/client'
import type { QualityLevel } from '@/types'
import { Badge, KpiCard, LoadingBlock, PageHeader } from '@/components/ui'
import { cn, statusLabel } from '@/lib/utils'

type QcTab = 'pending' | 'done' | 'all'

function dataStatusTone(status: string): 'info' | 'success' | 'warn' | 'neutral' {
  if (status === 'delivered') return 'success'
  if (status === 'optimized') return 'info'
  if (status === 'prelabeled') return 'warn'
  return 'neutral'
}

function qualityTone(q: QualityLevel | null): 'success' | 'info' | 'danger' | 'neutral' {
  if (q === 'high') return 'success'
  if (q === 'medium') return 'info'
  if (q === 'low') return 'danger'
  return 'neutral'
}

function qcStatusTone(s: string): 'warn' | 'success' | 'danger' | 'neutral' {
  if (s === 'pending') return 'warn'
  if (s === 'passed') return 'success'
  if (s === 'rejected') return 'danger'
  return 'neutral'
}

/** 质检中心列表 —— 对标 https://rkzhegwavgdgc.ok.kimi.link/qc */
export function QcPage() {
  const [tab, setTab] = useState<QcTab>('pending')
  const listQ = useQuery({ queryKey: ['qc'], queryFn: getQcPackages })
  const summaryQ = useQuery({ queryKey: ['qc-summary'], queryFn: getQcSummary })

  const filtered = useMemo(() => {
    const list = listQ.data ?? []
    if (tab === 'pending') return list.filter((p) => p.qcStatus === 'pending')
    if (tab === 'done') return list.filter((p) => p.qcStatus !== 'pending')
    return list
  }, [listQ.data, tab])

  if (listQ.isLoading || summaryQ.isLoading) return <LoadingBlock />

  const s = summaryQ.data ?? { pending: 0, passed: 0, rejected: 0, openIssues: 0 }
  const tabs: Array<{ key: QcTab; label: string }> = [
    { key: 'pending', label: '待质检' },
    { key: 'done', label: '已完成' },
    { key: 'all', label: '全部' },
  ]

  return (
    <div>
      <PageHeader
        title="质检中心"
        subtitle="视频回放 · Tag 编辑 · 质量打标(高/中/低) · 问题清单 · 批量质检"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="待质检" value={s.pending} accent="var(--warning)" />
        <KpiCard label="已通过" value={s.passed} accent="var(--success)" />
        <KpiCard label="已驳回" value={s.rejected} accent="var(--danger)" />
        <KpiCard label="未关闭问题" value={s.openIssues} accent="var(--info)" />
      </div>

      <div className="mt-5 mb-3 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm transition',
              tab === t.key
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-[var(--bg-panel)] text-xs text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">数据 ID</th>
                <th className="px-4 py-3 font-medium">数据状态</th>
                <th className="px-4 py-3 font-medium">场景</th>
                <th className="px-4 py-3 font-medium">Tag 数</th>
                <th className="px-4 py-3 font-medium">问题数</th>
                <th className="px-4 py-3 font-medium">质量</th>
                <th className="px-4 py-3 font-medium">质检状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[var(--text-muted)]">
                    当前筛选下暂无数据
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-[var(--border)] transition hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-[var(--text)]">{row.dataId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={dataStatusTone(row.dataStatus)}>
                        {statusLabel[row.dataStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{row.sceneLabel}</td>
                    <td className="px-4 py-3">{row.tagCount}</td>
                    <td className="px-4 py-3">
                      <span className={row.issueCount > 0 ? 'text-amber-300' : 'text-[var(--text-muted)]'}>
                        {row.issueCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {row.quality ? (
                        <Badge tone={qualityTone(row.quality)}>{statusLabel[row.quality]}</Badge>
                      ) : (
                        <span className="text-[var(--text-muted)]">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={qcStatusTone(row.qcStatus)}>{statusLabel[row.qcStatus]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/qc/${row.id}`}
                        className="inline-flex rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent)] hover:bg-blue-500/25"
                      >
                        {row.qcStatus === 'pending' ? '开始质检' : '查看详情'}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        共 {filtered.length} 条 · Tab：
        {tab === 'pending' ? '待质检' : tab === 'done' ? '已完成' : '全部'}
      </p>
    </div>
  )
}
