import { describe, expect, it } from 'vitest'
import {
  getQcHandTrajectory,
  getQcPlayback,
  getQcSummary,
  getSummary,
  retryJob,
  reviewQcPackage,
} from './client'
import { jobs, qcPackages, summary } from '@/mocks/data'

describe('api/client', () => {
  it('getSummary returns dashboard summary', async () => {
    const data = await getSummary()
    expect(data).toEqual(summary)
    expect(typeof data.todayUploads).toBe('number')
  })

  it('getQcSummary counts package statuses', async () => {
    const s = await getQcSummary()
    expect(s.pending + s.passed + s.rejected).toBe(qcPackages.length)
    expect(s.openIssues).toBeGreaterThanOrEqual(0)
  })

  it('returns independent, usable hand keyframes for each stereo camera', async () => {
    const playback = await getQcPlayback('dr2')
    const trajectory = await getQcHandTrajectory('dr2')
    const leftFrame = trajectory?.framesByCamera.rectified_left[0]
    const rightFrame = trajectory?.framesByCamera.rectified_right[0]

    expect(playback?.handTrajectory.source).toBe('prelabel_mock')
    expect(trajectory?.framesByCamera.rectified_left).toHaveLength(3)
    expect(trajectory?.framesByCamera.rectified_right).toHaveLength(3)
    expect(leftFrame?.frameIndex).toBe(rightFrame?.frameIndex)
    expect(leftFrame?.left).toHaveLength(21)
    expect(rightFrame?.right).toHaveLength(21)
    expect(leftFrame?.left?.[0]?.x).not.toBe(rightFrame?.left?.[0]?.x)
    expect(leftFrame?.right?.[0]?.x).not.toBe(rightFrame?.right?.[0]?.x)
    expect(leftFrame?.left).not.toBe(rightFrame?.left)
  })

  it('reviewQcPackage updates package in memory', async () => {
    const target = qcPackages.find((p) => p.qcStatus === 'pending')
    expect(target).toBeTruthy()
    if (!target) return

    const snapshot = {
      qcStatus: target.qcStatus,
      note: target.note,
      quality: target.quality,
      issueCount: target.issueCount,
    }

    const updated = await reviewQcPackage(target.id, {
      decision: 'passed',
      note: 'harness test',
      quality: 'high',
    })
    expect(updated?.qcStatus).toBe('passed')
    expect(updated?.note).toBe('harness test')
    expect(updated?.quality).toBe('high')
    expect(updated?.issueCount).toBe(0)

    target.qcStatus = snapshot.qcStatus
    target.note = snapshot.note
    target.quality = snapshot.quality
    target.issueCount = snapshot.issueCount
  })

  it('retryJob queues a failed job', async () => {
    const failed = jobs.find((j) => j.status === 'failed') ?? jobs[0]
    const snapshot = {
      status: failed.status,
      progress: failed.progress,
      error: failed.error,
    }
    failed.status = 'failed'
    failed.error = 'boom'

    const result = await retryJob(failed.id)
    expect(result?.status).toBe('queued')
    expect(result?.progress).toBe(0)
    expect(result?.error).toBeUndefined()

    failed.status = snapshot.status
    failed.progress = snapshot.progress
    failed.error = snapshot.error
  })
})
