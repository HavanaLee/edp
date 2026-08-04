import type { QcTag } from '@/types'

/** Tag 缩放时仍需保留的最短可编辑区间，和时间轴的 0.01s 展示精度兼容。 */
export const QC_TAG_MIN_DURATION_SEC = 0.1

export type QcTagDragMode = 'move' | 'resize-start' | 'resize-end'

/**
 * 将 Tag 的拖动结果限制在时间轴内，并保证可见的最小长度。
 * 移动时保持原长度；缩放时仅移动被拖动的一侧，避免相邻 Tag 的编辑互相影响。
 */
export function constrainQcTagRange(
  tag: QcTag,
  mode: QcTagDragMode,
  deltaSec: number,
  duration: number,
): Pick<QcTag, 'startSec' | 'endSec'> {
  const safeDuration = Math.max(0, duration)
  const minLength = Math.min(QC_TAG_MIN_DURATION_SEC, safeDuration)
  // 兼容后端历史数据越界：编辑的第一步先收敛到当前媒体时长，不能继续保留越界端点。
  const initialStart = Math.min(Math.max(0, tag.startSec), safeDuration)
  const initialEnd = Math.min(Math.max(initialStart, tag.endSec), safeDuration)
  const originalLength = Math.max(minLength, initialEnd - initialStart)

  if (mode === 'move') {
    const startSec = Math.min(
      Math.max(0, initialStart + deltaSec),
      Math.max(0, safeDuration - originalLength),
    )
    return { startSec, endSec: Math.min(safeDuration, startSec + originalLength) }
  }

  if (mode === 'resize-start') {
    return {
      startSec: Math.min(Math.max(0, initialStart + deltaSec), initialEnd - minLength),
      endSec: initialEnd,
    }
  }

  return {
    startSec: initialStart,
    endSec: Math.max(Math.min(safeDuration, initialEnd + deltaSec), initialStart + minLength),
  }
}
