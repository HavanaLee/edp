/**
 * API 层 —— 类似 Vue 项目里的 services/ 或 api/
 * 现在读 mocks；以后改成 fetch('/api/v1/...') 即可，页面不用动。
 */
import {
  collectionTasks,
  datasets,
  events,
  funnel,
  getOrCreateQcDetailExtra,
  jobs,
  operatorLatency,
  qcPackages,
  qualityDist,
  sceneStats,
  slices,
  summary,
  timeseries,
  workers,
} from '@/mocks/data'
import type { QualityLevel } from '@/types'

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

export async function reviewQcPackage(
  id: string,
  payload: { decision: 'passed' | 'rejected'; note: string; quality: QualityLevel },
) {
  await delay(300)
  const pkg = qcPackages.find((p) => p.id === id)
  if (pkg) {
    pkg.qcStatus = payload.decision
    pkg.quality = payload.quality
    pkg.note = payload.note
    if (payload.decision === 'passed' || payload.decision === 'rejected') {
      pkg.issueCount = payload.decision === 'passed' ? 0 : pkg.issueCount
    }
  }
  return pkg ?? null
}

export async function getDatasets() {
  await delay()
  return datasets
}

export async function getDataset(id: string) {
  await delay()
  return datasets.find((d) => d.id === id) ?? null
}
