import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Pause, Play, Save, SkipBack, SkipForward } from 'lucide-react'
import {
  getQcPackageDetail,
  getQcAnnotations,
  getQcPlayback,
  getQcHandTrajectory,
  postQcReview,
} from '@/api/client'
import type { QcIssueStatus, QcQualitySegment, QcTag } from '@/types'
import { QcCamStage } from '@/components/QcCamStage'
import { QcTimeline } from '@/components/QcTimeline'
import { Badge, Card, EmptyState, LoadingBlock } from '@/components/ui'
import { statusLabel } from '@/lib/utils'
import './QcDetailPage.scss'

function dataStatusTone(status: string): 'info' | 'success' | 'warn' | 'neutral' {
  if (status === 'delivered') return 'success'
  if (status === 'optimized') return 'info'
  if (status === 'prelabeled') return 'warn'
  return 'neutral'
}

function qualityColor(q: 'high' | 'medium' | 'low') {
  if (q === 'high') return '#22c55e'
  if (q === 'medium') return '#f59e0b'
  return '#ef4444'
}

function qualityLabel(q: 'high' | 'medium' | 'low') {
  return statusLabel[q]
}

/** 对标演示站：0.00s */
function formatTime(sec: number) {
  return `${sec.toFixed(2)}s`
}

/** 并行拉一期两个读接口；给 useQuery 当 queryFn（不要在组件里直接 await） */
// 获取质检详情和质检标注
async function getQcDetailInfos(id: string) {
  const [detail, annotations] = await Promise.all([getQcPackageDetail(id), getQcAnnotations(id)])
  if (!detail || !annotations) return null
  return { detail, annotations }
}

/**
 * 质检详情 —— 布局对标 https://rkzhegwavgdgc.ok.kimi.link/qc/dr2
 * 空格播放 · ←/→ 步进 · Q/W/E 打标 · Ctrl+S 保存
 */
export function QcDetailPage() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()

  // 质检详情
  const detailQ = useQuery({
    queryKey: ['qc-detail', id],
    queryFn: () => getQcDetailInfos(id),
    enabled: Boolean(id),
  })
  // 同步回放
  const playbackQ = useQuery({
    queryKey: ['qc-playback', id],
    queryFn: () => getQcPlayback(id),
    enabled: Boolean(id),
  })
  // 手轨迹
  const trajQ = useQuery({
    queryKey: ['qc-hand-trajectory', id],
    queryFn: () =>
      getQcHandTrajectory(id, {
        stride: playbackQ.data?.handTrajectory.frameStride ?? 2,
      }),
    enabled: Boolean(id) && Boolean(playbackQ.data),
  })
  // 数据
  const pkg = detailQ.data?.detail.package
  // 会话
  const session = detailQ.data?.detail.session
  // 标注
  const annotations = detailQ.data?.annotations
  // 同步回放
  const playback = playbackQ.data
  // 手轨迹帧序列：每路 rectified 相机使用自身二维投影，不能跨目复用。
  const leftHandFrames = trajQ.data?.framesByCamera.rectified_left ?? []
  const rightHandFrames = trajQ.data?.framesByCamera.rectified_right ?? []
  // 手轨迹帧步进
  const trajStride = trajQ.data?.stride ?? playback?.handTrajectory.frameStride ?? 2
  // 左目
  const leftCam = playback?.cameras.find((c) => c.role === 'rectified_left')
  const rightCam = playback?.cameras.find((c) => c.role === 'rectified_right')

  const [currentSec, setCurrentSec] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [seekRevision, setSeekRevision] = useState(0)
  const [markFromSec, setMarkFromSec] = useState(120)
  const [segments, setSegments] = useState<QcQualitySegment[]>([])
  const [tags, setTags] = useState<QcTag[]>([])
  const [overallQuality, setOverallQuality] = useState<'high' | 'medium' | 'low'>('high')
  const [issues, setIssues] = useState(annotations?.issues ?? [])
  const [savedTip, setSavedTip] = useState(false)

  useEffect(() => {
    if (!annotations || !session) return
    setSegments(annotations.qualitySegments)
    setTags(annotations.tags)
    setIssues(annotations.issues)
    setCurrentSec(0)
    setPlaying(false)
    const majority = annotations.qualitySegments[0]?.quality ?? 'high'
    setOverallQuality(majority)
  }, [annotations, session])

  /**
   * 时间轴 = 实际视频时长（playback 优先）；
   * 质量区间 / Tag = 接口 annotations，原样展示，前端不缩放。
   */
  const duration = playback?.durationSec ?? session?.durationSec ?? 300
  const mediaDuration = playback?.durationSec ?? duration
  const fps = playback?.fps ?? session?.fps ?? 30
  const frame = Math.min(Math.floor(currentSec * fps), Math.max(0, Math.floor(duration * fps) - 1))
  const useVideoAsClock = Boolean(leftCam?.url)

  /**
   * 页面内所有主动定位统一增加版本号，使播放中的时钟视频也会写入新的 currentTime。
   * 视频自然播放只更新 currentSec，不增加版本，避免左目被自己的 onTimeUpdate 反复 seek。
   */
  const seekTo = useCallback(
    (sec: number) => {
      const target = Math.round(Math.min(duration, Math.max(0, sec)) * 100) / 100
      setCurrentSec(target)
      setSeekRevision((revision) => revision + 1)
    },
    [duration],
  )

  const seekBy = useCallback(
    (deltaSec: number) => {
      seekTo(currentSec + deltaSec)
    },
    [currentSec, seekTo],
  )

  useEffect(() => {
    setMarkFromSec(Math.round(Math.min(duration * 0.4, duration) * 100) / 100)
  }, [duration])

  useEffect(() => {
    if (!playing || useVideoAsClock) return
    const timer = window.setInterval(() => {
      setCurrentSec((t) => {
        if (t >= duration) {
          setPlaying(false)
          return duration
        }
        return Math.min(duration, Math.round((t + 1 / fps) * 100) / 100)
      })
    }, 1000 / fps)
    return () => window.clearInterval(timer)
  }, [playing, duration, fps, useVideoAsClock])

  const reviewM = useMutation({
    mutationFn: (decision: 'passed' | 'rejected') =>
      postQcReview(id, {
        decision,
        note: `综合评级：${qualityLabel(overallQuality)}`,
        quality: overallQuality,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qc'] })
      queryClient.invalidateQueries({ queryKey: ['qc-summary'] })
      queryClient.invalidateQueries({ queryKey: ['qc-detail', id] })
      setSavedTip(true)
    },
  })

  const addSegment = useCallback(
    (quality: 'high' | 'medium' | 'low') => {
      const start = Math.min(markFromSec, currentSec)
      const end = Math.max(markFromSec, currentSec)
      if (end - start < 0.1) return
      setSegments((prev) => [
        ...prev.filter((s) => s.endSec <= start || s.startSec >= end),
        { id: `qs-${Date.now()}`, startSec: start, endSec: end, quality },
      ])
      setOverallQuality(quality)
      setMarkFromSec(currentSec)
    },
    [markFromSec, currentSec],
  )

  const undoLastSegment = () => {
    setSegments((prev) => prev.slice(0, -1))
  }

  const handleSave = useCallback(() => {
    setSavedTip(true)
    window.setTimeout(() => setSavedTip(false), 2000)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Space') {
        e.preventDefault()
        setPlaying((p) => !p)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekBy(-1 / fps)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekBy(1 / fps)
      } else if (e.key.toLowerCase() === 'q') {
        addSegment('high')
      } else if (e.key.toLowerCase() === 'w') {
        addSegment('medium')
      } else if (e.key.toLowerCase() === 'e') {
        addSegment('low')
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addSegment, duration, fps, handleSave, seekBy])

  const openIssueCount = useMemo(() => issues.filter((i) => i.status === 'open').length, [issues])

  const progressPct = useMemo(() => {
    if (!pkg) return 0
    if (pkg.qcStatus !== 'pending') return 100
    const covered = segments.reduce((sum, s) => sum + (s.endSec - s.startSec), 0)
    return Math.min(100, Math.round((covered / duration) * 100))
  }, [pkg, segments, duration])

  const setIssueStatus = (issueId: string, status: QcIssueStatus) => {
    setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status } : i)))
  }

  // 所有 hooks 必须在 early return 之前（Rules of Hooks）
  if (detailQ.isLoading || playbackQ.isLoading) return <LoadingBlock />
  if (!pkg || !session || !annotations) return <EmptyState text="未找到质检数据" />

  return (
    <div className="qc-detail-page -m-6 flex min-h-[calc(100vh)] flex-col bg-[var(--bg)]">
      {/* 顶栏 */}
      <header className="qc-detail-header">
        <div className="qc-detail-header__row">
          <div className="qc-detail-header__info">
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/qc" className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="font-mono text-lg font-semibold tracking-tight">{pkg.dataId}</h1>
              <Badge tone={dataStatusTone(pkg.dataStatus)}>{statusLabel[pkg.dataStatus]}</Badge>
              <Badge
                tone={
                  pkg.qcStatus === 'pending'
                    ? 'warn'
                    : pkg.qcStatus === 'passed'
                      ? 'success'
                      : 'danger'
                }
              >
                {pkg.qcStatus === 'pending' ? '质检中' : statusLabel[pkg.qcStatus]}
              </Badge>
              <span className="text-sm text-[var(--text-muted)]">· {session.inspector}</span>
            </div>
            <p className="mt-1 pl-7 text-xs text-[var(--text-muted)]">
              同步回放 rectified 左右目 + 3D 手部叠加 + Tag 时间轴 · 分布式锁 {session.lockKey}{' '}
              (10min)
            </p>
            <p className="mt-1 pl-7 text-[11px] text-[var(--text-muted)]">
              空格 播放 · ←/→ 步进 · Q/W/E 打标 · Ctrl+S 保存
            </p>
          </div>
          <button type="button" onClick={handleSave} className="qc-detail-header__save">
            <Save className="h-4 w-4" />
            保存 (Ctrl+S)
          </button>
        </div>
        {savedTip ? (
          <p className="mt-2 pl-7 text-xs text-emerald-300">已保存（Mock 本地状态）</p>
        ) : null}
      </header>
      <div className="qc-detail-main">
        <div className="flex-1 space-y-4 overflow-auto p-4">
          {/* 左右目：video 底层 + HandCanvas 上层，共用 currentSec */}
          <div className="qc-detail-images">
            <QcCamStage
              title={leftCam?.label ?? 'Left · rectified'}
              hint="左目校正 + 手轨迹"
              videoUrl={leftCam?.url}
              videoWidth={leftCam?.width ?? 640}
              videoHeight={leftCam?.height ?? 480}
              currentSec={currentSec}
              mediaDuration={mediaDuration}
              playing={playing}
              fps={fps}
              frames={leftHandFrames}
              stride={trajStride}
              isClock={useVideoAsClock}
              onClockTime={(t) => setCurrentSec(Math.min(duration, Math.round(t * 100) / 100))}
              seekRevision={seekRevision}
              onEnded={() => {
                setPlaying(false)
                setCurrentSec(duration)
              }}
            />
            <QcCamStage
              title={rightCam?.label ?? 'Right · rectified'}
              hint="右目校正 + 手轨迹"
              videoUrl={rightCam?.url}
              videoWidth={rightCam?.width ?? 640}
              videoHeight={rightCam?.height ?? 480}
              currentSec={currentSec}
              mediaDuration={mediaDuration}
              playing={playing}
              fps={fps}
              frames={rightHandFrames}
              stride={trajStride}
              seekRevision={seekRevision}
            />
          </div>
          {playback?.datasetRef ? (
            <p className="text-[11px] text-[var(--text-muted)]">
              媒体：{playback.datasetRef.datasetName} · ep{playback.datasetRef.episodeIndex} ·
              手轨迹 {playback.handTrajectory.source}
              {trajQ.isLoading ? ' · 轨迹加载中…' : ` · ${leftHandFrames.length} keys / camera`}
            </p>
          ) : null}

          {/* 播放控制 */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2">
            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-white/5"
              onClick={() => seekBy(-1)}
              title="回开头"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full bg-[var(--accent-soft)] p-2 text-[var(--accent)]"
              onClick={() => setPlaying((p) => !p)}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="rounded-md p-1.5 hover:bg-white/5"
              onClick={() => seekBy(1)}
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <div className="font-mono text-sm text-[var(--text-muted)]">
              {currentSec.toFixed(2)}s / {duration}s · Frame {frame}
            </div>
          </div>

          {/* 时间轴：对标 kimi /qc/dr2 —— 300s 刻度 + 质量色带 + 13 Tag */}
          <Card
            title="质量区间 + Tag 时间轴"
            extra={
              <span className="text-[11px] text-[var(--text-muted)]">
                上层=质量区间(绿高/黄中/红低) · 下层=Tag
              </span>
            }
          >
            <QcTimeline
              duration={duration}
              currentSec={currentSec}
              segments={segments}
              tags={tags}
              onSeek={seekTo}
              onTagsChange={setTags}
            />
          </Card>

          {/* 打标 + 结论 */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[var(--text-muted)]">
                从 {formatTime(markFromSec)} 到当前位置标记为：
              </span>
              <button
                type="button"
                className="rounded-md bg-emerald-500/20 px-2.5 py-1 text-xs text-emerald-300"
                onClick={() => addSegment('high')}
              >
                高质量 (Q)
              </button>
              <button
                type="button"
                className="rounded-md bg-amber-500/20 px-2.5 py-1 text-xs text-amber-300"
                onClick={() => addSegment('medium')}
              >
                中质量 (W)
              </button>
              <button
                type="button"
                className="rounded-md bg-rose-500/20 px-2.5 py-1 text-xs text-rose-300"
                onClick={() => addSegment('low')}
              >
                低质量 (E)
              </button>
              <button
                type="button"
                className="rounded-md border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                onClick={undoLastSegment}
              >
                撤销区间
              </button>
              <span className="ml-auto text-sm">
                综合评级：
                <strong className="ml-1" style={{ color: qualityColor(overallQuality) }}>
                  {qualityLabel(overallQuality)}
                </strong>
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
              <span className="text-sm text-[var(--text-muted)]">质检结论：</span>
              <button
                type="button"
                className="rounded-lg bg-emerald-500/20 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/30"
                onClick={() => reviewM.mutate('passed')}
              >
                通过（高质量可用）
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-500/20 px-4 py-2 text-sm text-rose-300 hover:bg-rose-500/30"
                onClick={() => reviewM.mutate('rejected')}
              >
                驳回 → 重新标注
              </button>
              {reviewM.isSuccess ? (
                <span className="text-xs text-emerald-300">结论已写入 Mock</span>
              ) : null}
            </div>
          </div>
        </div>
        {/* 问题清单 + 侧栏统计 */}
        <div className="grid gap-4 qc-detail-main__content">
          <Card
            title={`问题清单（${issues.length}）`}
            extra={
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-muted)]">open → fixed / ignored</span>
                <button
                  type="button"
                  className="rounded-md bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent)]"
                  onClick={() =>
                    setIssues((prev) => [
                      ...prev,
                      {
                        id: `iss-new-${Date.now()}`,
                        code: 'manual_note',
                        severity: 'low',
                        title: '新建问题（请编辑描述）',
                        frameStart: frame,
                        frameEnd: frame + 30,
                        author: session.inspector,
                        date: '07-30',
                        status: 'open',
                      },
                    ])
                  }
                >
                  提问题
                </button>
              </div>
            }
          >
            {issues.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">暂无问题</p>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-sky-300">{issue.code}</span>
                      <Badge
                        tone={
                          issue.severity === 'high'
                            ? 'danger'
                            : issue.severity === 'medium'
                              ? 'warn'
                              : 'neutral'
                        }
                      >
                        {issue.severity === 'high'
                          ? '高'
                          : issue.severity === 'medium'
                            ? '中等'
                            : '低'}
                      </Badge>
                      <Badge
                        tone={
                          issue.status === 'open'
                            ? 'warn'
                            : issue.status === 'fixed'
                              ? 'success'
                              : 'neutral'
                        }
                      >
                        {issue.status === 'open'
                          ? 'open'
                          : issue.status === 'fixed'
                            ? 'fixed'
                            : '— 已忽略'}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm">{issue.title}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
                      <span>
                        帧 {issue.frameStart}-{issue.frameEnd} · {issue.author} · {issue.date}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 hover:bg-white/5"
                          onClick={() => setIssueStatus(issue.id, 'fixed')}
                        >
                          fixed
                        </button>
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 hover:bg-white/5"
                          onClick={() => setIssueStatus(issue.id, 'ignored')}
                        >
                          ignored
                        </button>
                        <button
                          type="button"
                          className="rounded px-1.5 py-0.5 hover:bg-white/5"
                          onClick={() => setIssueStatus(issue.id, 'open')}
                        >
                          reopen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-3">
            <Card>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Tag 数</span>
                  <span>{tags.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">人工编辑</span>
                  <span>{session.manualEdits}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">低置信(&lt;80%)</span>
                  <span className="text-amber-300">{session.lowConfidenceCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">质量问题</span>
                  <span>{openIssueCount} 未关闭</span>
                </div>
              </div>
            </Card>
            <Card title="质检进度">
              <div className="mb-2 text-3xl font-semibold">{progressPct}%</div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-[var(--accent)]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                按已覆盖质量区间估算（Mock）
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
