import { useMemo, useRef } from 'react'
import type { QcQualitySegment, QcTag } from '@/types'
import { cn, statusLabel } from '@/lib/utils'

function qualityColor(q: 'high' | 'medium' | 'low') {
  if (q === 'high') return '#22c55e'
  if (q === 'medium') return '#f59e0b'
  return '#ef4444'
}

function qualityLabel(q: 'high' | 'medium' | 'low') {
  return statusLabel[q]
}

type Props = {
  duration: number
  currentSec: number
  segments: QcQualitySegment[]
  tags: QcTag[]
  onSeek: (sec: number) => void
}

/**
 * 质量区间 + Tag 时间轴
 * - 轴长 = 页面传入的 duration（实际视频时长）
 * - 质量区间 / Tag = 接口数据原样按 startSec/endSec 映射
 */
export function QcTimeline({ duration, currentSec, segments, tags, onSeek }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  const ticks = useMemo(() => {
    if (duration <= 0) return [0]
    const step = duration <= 20 ? 2 : duration <= 60 ? 5 : duration <= 120 ? 15 : 30
    const list: number[] = []
    for (let t = 0; t < duration; t += step) {
      list.push(Math.round(t * 100) / 100)
    }
    const end = Math.round(duration * 100) / 100
    if (list[list.length - 1] !== end) list.push(end)
    return list
  }, [duration])

  const seekFromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el || duration <= 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onSeek(Math.round(ratio * duration * 100) / 100)
  }

  const playheadPct = duration > 0 ? Math.min(100, (currentSec / duration) * 100) : 0

  return (
    <div className="qc-timeline">
      <div
        ref={trackRef}
        className="qc-timeline__track"
        onClick={(e) => seekFromClientX(e.clientX)}
      >
        <div className="qc-timeline__ticks">
          {ticks.map((t) => (
            <span key={t}>{t}s</span>
          ))}
        </div>

        <div className="qc-timeline__quality">
          {segments.map((s) => {
            const left = (s.startSec / duration) * 100
            const width = ((s.endSec - s.startSec) / duration) * 100
            if (width <= 0 || s.startSec >= duration) return null
            return (
              <div
                key={s.id}
                className="qc-timeline__quality-seg"
                style={{
                  left: `${left}%`,
                  width: `${Math.min(width, 100 - left)}%`,
                  background: qualityColor(s.quality),
                }}
                title={`${qualityLabel(s.quality)} ${s.startSec}-${s.endSec}s`}
              />
            )
          })}
        </div>

        <div className="qc-timeline__tags">
          {tags.map((tag) => {
            if (tag.startSec >= duration) return null
            const left = (tag.startSec / duration) * 100
            const end = Math.min(tag.endSec, duration)
            const width = Math.max(1.2, ((end - tag.startSec) / duration) * 100)
            return (
              <div
                key={tag.id}
                className={cn(
                  'qc-timeline__tag',
                  tag.confidence < 0.8 ? 'is-low-conf' : 'is-normal',
                  tag.edited && 'is-edited',
                )}
                style={{ left: `${left}%`, width: `${Math.min(width, 100 - left)}%` }}
                title={`${tag.label} ${tag.startSec}-${tag.endSec}s · conf ${(tag.confidence * 100).toFixed(0)}%`}
                onClick={(e) => {
                  e.stopPropagation()
                  onSeek(tag.startSec)
                }}
              >
                <span className="qc-timeline__tag-label">{tag.label}</span>
              </div>
            )
          })}
        </div>

        <div className="qc-timeline__playhead" style={{ left: `${playheadPct}%` }} />
      </div>

      <div className="qc-timeline__footer">
        <span>点击空白跳转 · 点击 Tag 跳到起点</span>
        <span>{duration}s</span>
      </div>
    </div>
  )
}
