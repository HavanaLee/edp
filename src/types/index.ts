/** 领域类型 —— Vue 同学可把这里当成 types/*.ts / interface 定义 */

export type PipelineStage =
  | 'raw'
  | 'split'
  | 'parse'
  | 'voicetag'
  | 'prelabel'
  | 'extrinsic'
  | 'postprocess'
  | 'lerobot'
  | 'qc_pass'

export type SceneCode =
  | 'office'
  | 'kitchen'
  | 'living'
  | 'desktop'
  | 'shelf'
  | 'meeting'

export type CollectionStatus =
  | 'recording'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'failed'

export type JobStatus = 'queued' | 'running' | 'success' | 'failed'

export type QualityLevel = 'high' | 'medium' | 'low' | 'pending'

export interface DashboardSummary {
  todayUploads: number
  todayMinutes: number
  uploadDeltaPct: number
  workersRunning: number
  queueDepth: number
  workersOnline: string
  gpuUtil: number
  gpuPool: string
  qcPassRate: number
  qcPassed: number
  qcPending: number
  highQualityPct: number
  deliveredPackages: number
  failedJobs: number
  dateLabel: string
}

export interface FunnelItem {
  stage: PipelineStage
  label: string
  total: number
  inStock: number
}

export interface TimeseriesPoint {
  date: string
  uploads: number
  parsed: number
  delivered: number
}

export interface QualityDist {
  high: number
  medium: number
  low: number
  pending: number
}

export interface SceneStat {
  scene: SceneCode
  label: string
  count: number
}

export interface EventItem {
  id: string
  time: string
  message: string
  level: 'info' | 'warn' | 'success'
}

export interface OperatorLatency {
  name: string
  avgMin: number
  p95Min: number
}

export interface CollectionTask {
  id: string
  title: string
  scene: SceneCode
  sceneLabel: string
  operator: string
  deviceSn: string
  status: CollectionStatus
  sliceDone: number
  sliceTotal: number
  updatedAt: string
}

export interface DataSlice {
  id: string
  taskId: string
  stage: PipelineStage
  stageLabel: string
  durationSec: number
  scene: SceneCode
  sceneLabel: string
  quality: QualityLevel
  storageUri: string
  updatedAt: string
}

export interface PipelineJob {
  id: string
  sliceId: string
  operator: string
  status: JobStatus
  progress: number
  error?: string
  createdAt: string
  finishedAt?: string
}

export interface WorkerNode {
  name: string
  role: string
  roleLabel: string
  status: 'online' | 'busy' | 'offline'
  gpuUtil: number
  memGb: number
  currentJobId?: string
  lastHeartbeatAt: string
}

/** 数据在流水线中的业务状态（质检列表「数据状态」列） */
export type QcDataStatus = 'prelabeled' | 'optimized' | 'delivered'

export interface QcPackage {
  id: string
  /** 展示用数据 ID，如 ST0611-0618-RAW-002 */
  dataId: string
  name: string
  dataStatus: QcDataStatus
  scene: SceneCode
  sceneLabel: string
  tagCount: number
  issueCount: number
  version: string
  episodes: number
  frames: number
  /** null 表示尚未打标，表格显示为 - */
  quality: QualityLevel | null
  qcStatus: 'pending' | 'passed' | 'rejected'
  path: string
  createdAt: string
  note?: string
}

export interface QcSummary {
  pending: number
  passed: number
  rejected: number
  openIssues: number
}

export type QcIssueStatus = 'open' | 'fixed' | 'ignored'

export interface QcTag {
  id: string
  label: string
  startSec: number
  endSec: number
  confidence: number
  edited?: boolean
}

export interface QcIssue {
  id: string
  code: string
  severity: 'low' | 'medium' | 'high'
  title: string
  frameStart: number
  frameEnd: number
  author: string
  date: string
  status: QcIssueStatus
}

export interface QcQualitySegment {
  id: string
  startSec: number
  endSec: number
  quality: 'high' | 'medium' | 'low'
}

export interface QcDetailExtra {
  inspector: string
  durationSec: number
  fps: number
  lockKey: string
  tags: QcTag[]
  issues: QcIssue[]
  qualitySegments: QcQualitySegment[]
  manualEdits: number
  lowConfidenceCount: number
}

export interface DeliveryDataset {
  id: string
  name: string
  task: string
  version: string
  episodes: number
  frames: number
  videos: number
  fps: number
  robotType: string
  path: string
  qcStatus: 'pending' | 'passed' | 'rejected'
}
