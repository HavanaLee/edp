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

/** 一期详情：包摘要 + 会话（不含标注明细） */
export interface QcSession {
  inspector: string
  durationSec: number
  fps: number
  lockKey: string
  manualEdits: number
  lowConfidenceCount: number
}

/** 一期详情：Tag / 问题 / 质量区间 */
export interface QcAnnotations {
  tags: QcTag[]
  issues: QcIssue[]
  qualitySegments: QcQualitySegment[]
}

/** PUT 保存草稿请求体 */
export interface QcAnnotationsUpdate {
  tags: QcTag[]
  issues: QcIssue[]
  qualitySegments: QcQualitySegment[]
}

/** GET 轻量详情 */
export interface QcPackageDetail {
  package: QcPackage
  session: QcSession
}

/** POST 终审请求体 */
export interface QcReviewPayload {
  decision: 'passed' | 'rejected'
  note: string
  quality: QualityLevel
}

/** ---------- 质检播放：视频 + 手轨迹 ---------- */

/** 单路相机/画面流 */
export interface QcCameraStream {
  key: 'cam_left' | 'cam_right' | 'cam_high'
  label: string
  /** 详情页槽位：左目校正 / 右目校正 / 俯视（可叠手轨迹） */
  role: 'rectified_left' | 'rectified_right' | 'overview'
  width: number
  height: number
  codec: string
  /**
   * 可播放地址。
   * Mock：相对数据集根的路径，或 `/media/...` 占位；接静态服务后可直接给 `<video src>`。
   */
  url: string
}

/** 可叠加二维手部关键点的相机画面 */
export type QcHandTrajectoryCameraRole = 'rectified_left' | 'rectified_right'

/** 单只手一个关键点（归一化或相机坐标系，见文档） */
export interface HandLandmark {
  x: number
  y: number
  z: number
}

/** 某一帧双手姿态（对齐 HaMeR / MediaPipe 21 点） */
export interface HandPoseFrame {
  frameIndex: number
  timeSec: number
  left: HandLandmark[] | null
  right: HandLandmark[] | null
  confidence: number
}

/** 播放清单：三路视频 + 手轨迹元信息 */
export interface QcPlaybackManifest {
  packageId: string
  fps: number
  durationSec: number
  frameCount: number
  cameras: QcCameraStream[]
  handTrajectory: {
    source: 'prelabel_mock' | 'prelabel' | 'none'
    /** 每手关键点数，固定 21 */
    landmarkCount: number
    hands: Array<'left' | 'right'>
    /** 轨迹采样步长（1=每帧） */
    frameStride: number
    /** 坐标系说明 */
    space: 'image_normalized' | 'camera'
    /** 拉全量/区间轨迹的约定路径 */
    trajectoryPath: string
  }
  /** 若绑定本地 LeRobot episode，便于拼磁盘路径 */
  datasetRef?: {
    datasetId: string
    datasetName: string
    episodeIndex: number
    localPath: string
  }
}

export interface HandTrajectoryQuery {
  startFrame?: number
  endFrame?: number
  /** 默认用 manifest.frameStride */
  stride?: number
}

export interface HandTrajectoryResponse {
  packageId: string
  fps: number
  landmarkCount: number
  startFrame: number
  endFrame: number
  stride: number
  /**
   * 每路相机各自 rectified 图像坐标系中的归一化二维关键点。
   * 同一只手在双目画面有视差，不能跨相机复用。
   */
  framesByCamera: Record<QcHandTrajectoryCameraRole, HandPoseFrame[]>
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

/** 相机通道（对应 meta/info.json features 中的 video 项） */
export interface LerobotCamera {
  key: string
  label: string
  width: number
  height: number
  codec: string
  fps: number
  channels: number
}

/** 单条 episode（对应 meta/episodes.jsonl 一行 + 路径展开） */
export interface LerobotEpisode {
  episodeIndex: number
  length: number
  durationSec: number
  task: string
  chunk: number
  dataPath: string
  videos: {
    camHigh: string
    camLeft: string
    camRight: string
  }
}

/**
 * 本地 LeRobot v2.1 数据集完整 Mock
 * 对应仓库根目录 black_*_to_wooden_stand/lerobot_data
 */
export interface LerobotDataset {
  id: string
  name: string
  task: string
  version: string
  robotType: string
  fps: number
  totalEpisodes: number
  totalFrames: number
  totalVideos: number
  totalChunks: number
  chunksSize: number
  splits: Record<string, string>
  dataPathTemplate: string
  videoPathTemplate: string
  /** 相对 edp-web 的本地路径 */
  localPath: string
  cameras: LerobotCamera[]
  /** feature 键名列表（不含完整 shape，见文档） */
  featureKeys: string[]
  qcStatus: 'pending' | 'passed' | 'rejected'
  episodes: LerobotEpisode[]
}

/** 列表接口用的摘要（不含 episodes 明细） */
export type LerobotDatasetSummary = Omit<LerobotDataset, 'episodes'>
