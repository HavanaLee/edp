import { describe, expect, it } from 'vitest'
import { formatNumber, pct, stageLabels, statusLabel } from './utils'

describe('pct', () => {
  it('rounds ratio to percent string', () => {
    expect(pct(0.456)).toBe('46%')
    expect(pct(1)).toBe('100%')
    expect(pct(0)).toBe('0%')
  })
})

describe('formatNumber', () => {
  it('formats with zh-CN locale', () => {
    expect(formatNumber(1234)).toBe((1234).toLocaleString('zh-CN'))
  })
})

describe('labels', () => {
  it('covers key pipeline stages', () => {
    expect(stageLabels.raw).toBe('原始')
    expect(stageLabels.lerobot).toBe('LeRobot 交付')
  })

  it('covers qc statuses', () => {
    expect(statusLabel.pending).toBe('待质检')
    expect(statusLabel.passed).toBe('已通过')
    expect(statusLabel.rejected).toBe('已驳回')
  })
})
