import { useMemo, useRef } from 'react'
import type { PointerEvent } from 'react'
import type { QcQualitySegment, QcTag } from '@/types'
import { cn, statusLabel } from '@/lib/utils'
import { constrainQcTagRange, type QcTagDragMode } from './QcTimeline.utils'

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
  onTagsChange: (tags: QcTag[]) => void
}

const TAG_RESIZE_HANDLE_PX = 8

type TagDragState = {
  id: string
  pointerId: number
  startClientX: number
  initialTag: QcTag
  mode: QcTagDragMode
  moved: boolean
}

/**
 * 质量区间 + Tag 时间轴
 * - 轴长 = 页面传入的 duration（实际视频时长）
 * - Tag 可拖动整体位置或左右边缘，编辑结果通过 onTagsChange 回写页面状态
 */
export function QcTimeline({ duration, currentSec, segments, tags, onSeek, onTagsChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const seekingPointerIdRef = useRef<number | null>(null)
  const tagDragRef = useRef<TagDragState | null>(null)

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
    if (!el || duration <= 0 || el.getBoundingClientRect().width <= 0) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onSeek(Math.round(ratio * duration * 100) / 100)
  }

  /**
   * 空白轨道使用独立的 pointer capture 连续 seek。
   * Tag 在自身事件中停止冒泡，确保调整标注时不会意外改变播放位置。
   */
  const handleTrackPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    seekingPointerIdRef.current = event.pointerId
    event.currentTarget.setPointerCapture(event.pointerId)
    seekFromClientX(event.clientX)
  }

  const handleTrackPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (seekingPointerIdRef.current !== event.pointerId) return
    seekFromClientX(event.clientX)
  }

  const stopTrackSeeking = (event: PointerEvent<HTMLDivElement>) => {
    if (seekingPointerIdRef.current !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    seekingPointerIdRef.current = null
  }

  const handleTagPointerDown = (event: PointerEvent<HTMLDivElement>, tag: QcTag) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    const bounds = event.currentTarget.getBoundingClientRect()
    const mode: QcTagDragMode =
      event.clientX - bounds.left <= TAG_RESIZE_HANDLE_PX
        ? 'resize-start'
        : bounds.right - event.clientX <= TAG_RESIZE_HANDLE_PX
          ? 'resize-end'
          : 'move'
    tagDragRef.current = {
      id: tag.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      initialTag: tag,
      mode,
      moved: false,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleTagPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = tagDragRef.current
    const track = trackRef.current
    if (!drag || drag.pointerId !== event.pointerId || !track) return
    event.preventDefault()
    event.stopPropagation()
    const width = track.getBoundingClientRect().width
    if (width <= 0 || duration <= 0) return
    const deltaSec = ((event.clientX - drag.startClientX) / width) * duration
    const range = constrainQcTagRange(drag.initialTag, drag.mode, deltaSec, duration)
    drag.moved ||= Math.abs(event.clientX - drag.startClientX) > 2
    // 每次移动都从按下瞬间的快照计算，避免状态异步更新累积误差。
    onTagsChange(tags.map((tag) => (tag.id === drag.id ? { ...tag, ...range, edited: true } : tag)))
  }

  const stopTagDragging = (event: PointerEvent<HTMLDivElement>) => {
    const drag = tagDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    // 保留原有点击 Tag 跳转能力，但只有没有发生拖动时才触发。
    if (!drag.moved) onSeek(drag.initialTag.startSec)
    tagDragRef.current = null
  }

  // 系统取消手势时只释放捕获，不把未完成的编辑误判为点击跳转。
  const cancelTagDragging = (event: PointerEvent<HTMLDivElement>) => {
    const drag = tagDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    tagDragRef.current = null
  }

  const playheadPct = duration > 0 ? Math.min(100, (currentSec / duration) * 100) : 0

  return (
    <div className="qc-timeline">
      <div
        ref={trackRef}
        className="qc-timeline__track"
        onPointerDown={handleTrackPointerDown}
        onPointerMove={handleTrackPointerMove}
        onPointerUp={stopTrackSeeking}
        onPointerCancel={stopTrackSeeking}
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
                onPointerDown={(event) => handleTagPointerDown(event, tag)}
                onPointerMove={handleTagPointerMove}
                onPointerUp={stopTagDragging}
                onPointerCancel={cancelTagDragging}
              >
                <span className="qc-timeline__tag-handle is-start" aria-hidden="true" />
                <span className="qc-timeline__tag-label">{tag.label}</span>
                <span className="qc-timeline__tag-handle is-end" aria-hidden="true" />
              </div>
            )
          })}
        </div>

        <div className="qc-timeline__playhead" style={{ left: `${playheadPct}%` }} />
      </div>

      <div className="qc-timeline__footer">
        <span>拖动空白跳转 · 拖动 Tag 移动或缩放</span>
        <span>{duration}s</span>
      </div>
    </div>
  )
}
