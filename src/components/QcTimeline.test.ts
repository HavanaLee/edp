import { describe, expect, it } from 'vitest'
import type { QcTag } from '@/types'
import { QC_TAG_MIN_DURATION_SEC, constrainQcTagRange } from './QcTimeline.utils'

const tag: QcTag = {
  id: 'tag-1',
  label: '抓取',
  startSec: 2,
  endSec: 4,
  confidence: 0.9,
}

describe('constrainQcTagRange', () => {
  it('移动时保持原长度并限制在时间轴边界内', () => {
    expect(constrainQcTagRange(tag, 'move', -10, 10)).toEqual({
      startSec: 0,
      endSec: 2,
    })
    expect(constrainQcTagRange(tag, 'move', 10, 5)).toEqual({
      startSec: 3,
      endSec: 5,
    })
  })

  it('缩放时保证最小长度且不超出边界', () => {
    expect(constrainQcTagRange(tag, 'resize-start', 10, 10)).toEqual({
      startSec: 4 - QC_TAG_MIN_DURATION_SEC,
      endSec: 4,
    })
    expect(constrainQcTagRange(tag, 'resize-end', -10, 10)).toEqual({
      startSec: 2,
      endSec: 2 + QC_TAG_MIN_DURATION_SEC,
    })
    expect(constrainQcTagRange(tag, 'resize-end', 10, 5)).toEqual({
      startSec: 2,
      endSec: 5,
    })
  })
})
