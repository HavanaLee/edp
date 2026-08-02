/**
 * API 层 —— 类似 Vue 项目里的 services/ 或 api/
 * 现在读 mocks；以后改成 fetch('/api/v1/...') 即可，页面不用动。
 */
import {
  collectionTasks,
  datasets,
  events,
  findLerobotDataset,
  funnel,
  getOrCreateQcDetailExtra,
  jobs,
  lerobotDatasets,
  operatorLatency,
  qcPackages,
  qualityDist,
  saveQcAnnotations,
  sceneStats,
  slices,
  summary,
  timeseries,
  toQcAnnotations,
  toQcSession,
  workers,
} from '@/mocks/data'
import { buildHandTrajectory, buildQcPlaybackManifest } from '@/mocks/qcPlayback'
import type {
  HandTrajectoryQuery,
  LerobotDatasetSummary,
  QcAnnotationsUpdate,
  QcReviewPayload,
  QualityLevel,
} from '@/types'

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms))

export async function getSummary() {
  await delay()
  return summary
}

export async function getFunnel() {
  await delay()
  return funnel
}

export async function getTimeseries() {
  await delay()
  return timeseries
}

export async function getQualityDist() {
  await delay()
  return qualityDist
}

export async function getSceneStats() {
  await delay()
  return sceneStats
}

export async function getEvents() {
  await delay(80)
  return events
}

export async function getOperatorLatency() {
  await delay()
  return operatorLatency
}

export async function getCollectionTasks() {
  await delay()
  return collectionTasks
}

export async function getCollectionTask(id: string) {
  await delay()
  return collectionTasks.find((t) => t.id === id) ?? null
}

export async function getSlices(stage?: string) {
  await delay()
  if (!stage || stage === 'all') return slices
  return slices.filter((s) => s.stage === stage)
}

export async function getJobs() {
  await delay()
  return jobs
}

export async function retryJob(id: string) {
  await delay(300)
  const job = jobs.find((j) => j.id === id)
  if (job) {
    job.status = 'queued'
    job.progress = 0
    job.error = undefined
  }
  return job ?? null
}

export async function getWorkers() {
  await delay()
  return workers
}

export async function getQcPackages() {
  await delay()
  return qcPackages
}

export async function getQcPackage(id: string) {
  await delay()
  return qcPackages.find((p) => p.id === id) ?? null
}

/**
 * 一期-1：轻量详情，包摘要 + 会话（不含 tags/issues/segments）
 * GET /api/v1/qc/packages/:id
 */
export async function getQcPackageDetail(id: string) {
  await delay()
  const pkg = qcPackages.find((p) => p.id === id)
  if (!pkg) return null
  const extra = getOrCreateQcDetailExtra(id, pkg)
  return {
    package: pkg,
    session: toQcSession(extra),
  }
}

/**
 * 一期-2：标注明细
 * GET /api/v1/qc/packages/:id/annotations
 */
export async function getQcAnnotations(id: string) {
  await delay()
  const pkg = qcPackages.find((p) => p.id === id)
  if (!pkg) return null
  return toQcAnnotations(getOrCreateQcDetailExtra(id, pkg))
}

/**
 * 一期-3：保存草稿（整表覆盖）
 * PUT /api/v1/qc/packages/:id/annotations
 */
export async function putQcAnnotations(id: string, payload: QcAnnotationsUpdate) {
  await delay(300)
  const pkg = qcPackages.find((p) => p.id === id)
  if (!pkg) return null
  return saveQcAnnotations(id, pkg, payload)
}

/**
 * 一期-4：终审通过/驳回
 * POST /api/v1/qc/packages/:id/review
 */
export async function postQcReview(id: string, payload: QcReviewPayload) {
  await delay(300)
  const pkg = qcPackages.find((p) => p.id === id)
  if (!pkg) return null
  pkg.qcStatus = payload.decision
  pkg.quality = payload.quality
  pkg.note = payload.note
  if (payload.decision === 'passed') {
    pkg.issueCount = 0
  }
  return pkg
}

/**
 * 播放媒体-1：三路视频清单 + 手轨迹元信息
 * GET /api/v1/qc/packages/:id/playback
 */
export async function getQcPlayback(id: string) {
  await delay()
  return buildQcPlaybackManifest(id)
}

/**
 * 播放媒体-2：手部轨迹帧序列（可按帧区间拉取）
 * GET /api/v1/qc/packages/:id/hand-trajectory?startFrame=&endFrame=&stride=
 */
export async function getQcHandTrajectory(id: string, query: HandTrajectoryQuery = {}) {
  await delay(120)
  return buildHandTrajectory(id, query)
}

/** @deprecated 兼容旧页面：等价于 detail + annotations 合并 */
export async function getQcDetail(id: string) {
  await delay()
  const pkg = qcPackages.find((p) => p.id === id)
  if (!pkg) return null
  return {
    package: pkg,
    extra: getOrCreateQcDetailExtra(id, pkg),
  }
}

export async function getQcSummary() {
  await delay()
  const pending = qcPackages.filter((p) => p.qcStatus === 'pending').length
  const passed = qcPackages.filter((p) => p.qcStatus === 'passed').length
  const rejected = qcPackages.filter((p) => p.qcStatus === 'rejected').length
  const openIssues = qcPackages
    .filter((p) => p.qcStatus === 'pending')
    .reduce((sum, p) => sum + p.issueCount, 0)
  return { pending, passed, rejected, openIssues }
}

/** @deprecated 请改用 postQcReview */
export async function reviewQcPackage(
  id: string,
  payload: { decision: 'passed' | 'rejected'; note: string; quality: QualityLevel },
) {
  return postQcReview(id, payload)
}

export async function getDatasets() {
  await delay()
  return datasets
}

export async function getDataset(id: string) {
  await delay()
  return datasets.find((d) => d.id === id) ?? null
}

/** ---------- LeRobot 本地数据集（black_pen / black_mouse）---------- */

function toSummary(ds: (typeof lerobotDatasets)[number]): LerobotDatasetSummary {
  const { episodes: _episodes, ...summary } = ds
  return summary
}

/** GET /api/v1/lerobot/datasets */
export async function getLerobotDatasets() {
  await delay()
  return lerobotDatasets.map(toSummary)
}

/**
 * GET /api/v1/lerobot/datasets/:idOrName
 * idOrName 支持 `ds-pen` / `ds-mouse` 或完整数据集名
 */
export async function getLerobotDataset(idOrName: string) {
  await delay()
  return findLerobotDataset(idOrName) ?? null
}

/** GET /api/v1/lerobot/datasets/:idOrName/episodes */
export async function getLerobotEpisodes(idOrName: string) {
  await delay()
  const ds = findLerobotDataset(idOrName)
  return ds?.episodes ?? null
}

/**
 * GET /api/v1/lerobot/datasets/:idOrName/episodes/:episodeIndex
 */
export async function getLerobotEpisode(idOrName: string, episodeIndex: number) {
  await delay()
  const ds = findLerobotDataset(idOrName)
  if (!ds) return null
  return ds.episodes.find((e) => e.episodeIndex === episodeIndex) ?? null
}
