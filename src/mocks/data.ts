import type {
  CollectionTask,
  DashboardSummary,
  DataSlice,
  EventItem,
  FunnelItem,
  OperatorLatency,
  PipelineJob,
  QcPackage,
  QualityDist,
  SceneStat,
  TimeseriesPoint,
  WorkerNode,
} from '@/types'
import type { QcDataStatus, QualityLevel, SceneCode } from '@/types'
import { lerobotDatasets, toDeliveryDataset } from '@/mocks/lerobotDatasets'

export { lerobotDatasets, findLerobotDataset } from '@/mocks/lerobotDatasets'

/** Mock 数据 —— 后期接真实 API 时，只需改 api/*.ts，不必改页面 */

export const summary: DashboardSummary = {
  todayUploads: 41,
  todayMinutes: 205,
  uploadDeltaPct: 12.2,
  workersRunning: 1,
  queueDepth: 75,
  workersOnline: '38/40',
  gpuUtil: 0.62,
  gpuPool: '4×A100 (MIG 共享)',
  qcPassRate: 0.88,
  qcPassed: 15,
  qcPending: 25,
  highQualityPct: 0.63,
  deliveredPackages: 22,
  failedJobs: 3,
  dateLabel: '2026-07-17 · 数据链路实时模拟中',
}

export const funnel: FunnelItem[] = [
  { stage: 'raw', label: '1. 原始', total: 42, inStock: 4 },
  { stage: 'split', label: '2. 切分', total: 38, inStock: 4 },
  { stage: 'parse', label: '3. 解析', total: 34, inStock: 4 },
  { stage: 'prelabel', label: '4. 预标', total: 30, inStock: 4 },
  { stage: 'postprocess', label: '5. 优化', total: 26, inStock: 4 },
  { stage: 'lerobot', label: '6. 交付', total: 22, inStock: 9 },
  { stage: 'qc_pass', label: '7. 质检通过', total: 13, inStock: 13 },
]

export const timeseries: TimeseriesPoint[] = [
  { date: '07-11', uploads: 28, parsed: 22, delivered: 12 },
  { date: '07-12', uploads: 35, parsed: 30, delivered: 15 },
  { date: '07-13', uploads: 42, parsed: 36, delivered: 18 },
  { date: '07-14', uploads: 31, parsed: 28, delivered: 14 },
  { date: '07-15', uploads: 48, parsed: 40, delivered: 20 },
  { date: '07-16', uploads: 39, parsed: 34, delivered: 17 },
  { date: '07-17', uploads: 41, parsed: 37, delivered: 19 },
]

export const qualityDist: QualityDist = {
  high: 58,
  medium: 27,
  low: 9,
  pending: 21,
}

export const sceneStats: SceneStat[] = [
  { scene: 'office', label: '工位-日常办公', count: 7 },
  { scene: 'kitchen', label: '厨房-取放物品', count: 7 },
  { scene: 'living', label: '客厅-整理收纳', count: 7 },
  { scene: 'desktop', label: '桌面-精细操作', count: 7 },
  { scene: 'shelf', label: '货架-抓取分拣', count: 7 },
  { scene: 'meeting', label: '会议室-书写演示', count: 7 },
]

export const events: EventItem[] = [
  {
    id: 'e1',
    time: '15:04:43',
    message: 'ST0709-0716-RAW-022 重投影误差 0.47px 接近阈值 0.5px',
    level: 'warn',
  },
  {
    id: 'e2',
    time: '15:04:43',
    message: 'Redis Stream XADD slice.done → ST0709-0716-RAW-014',
    level: 'info',
  },
  {
    id: 'e3',
    time: '15:04:43',
    message: 'ASR 解析完成: ST0602-0610-RAW-029 输出 23 条 Tag',
    level: 'success',
  },
  {
    id: 'e4',
    time: '15:04:43',
    message: 'HaMeR batch 推理完成: ST0611-0618-RAW-016 (batch=16, 214ms/frame)',
    level: 'success',
  },
  {
    id: 'e5',
    time: '15:04:43',
    message: 'ParseWorker 完成去畸变+校正: ST0709-0716-RAW-023',
    level: 'success',
  },
  {
    id: 'e6',
    time: '15:04:43',
    message: 'MinIO ObjectCreated: s3://edp-bucket/ST0623-0630-RAW-013/raw/left.mp4',
    level: 'info',
  },
]

export const operatorLatency: OperatorLatency[] = [
  { name: '5min 切分', avgMin: 2.1, p95Min: 3.4 },
  { name: '语音 Tag 解析', avgMin: 4.8, p95Min: 7.2 },
  { name: '去畸变/双目校正', avgMin: 6.5, p95Min: 9.1 },
  { name: '手部 3D 预标', avgMin: 11.2, p95Min: 15.8 },
  { name: '高精度外参', avgMin: 8.4, p95Min: 12.0 },
  { name: '后处理优化', avgMin: 3.6, p95Min: 5.5 },
  { name: 'LeRobot 交付打包', avgMin: 5.0, p95Min: 7.8 },
]

export const collectionTasks: CollectionTask[] = [
  {
    id: 'ST0701-0708-004',
    title: '精细操作采集 #4',
    scene: 'desktop',
    sceneLabel: '桌面-精细操作',
    operator: '陈静',
    deviceSn: 'OE7161236512',
    status: 'processing',
    sliceDone: 4,
    sliceTotal: 4,
    updatedAt: '2026-07-17T14:52:00',
  },
  {
    id: 'ST0709-0716-005',
    title: '抓取分拣采集 #5',
    scene: 'shelf',
    sceneLabel: '货架-抓取分拣',
    operator: '周杰',
    deviceSn: 'OE7161236513',
    status: 'uploading',
    sliceDone: 3,
    sliceTotal: 6,
    updatedAt: '2026-07-17T15:01:00',
  },
  {
    id: 'ST0717-0724-006',
    title: '书写演示采集 #6',
    scene: 'meeting',
    sceneLabel: '会议室-书写演示',
    operator: '张伟',
    deviceSn: 'ZEDM-44012208',
    status: 'recording',
    sliceDone: 2,
    sliceTotal: 8,
    updatedAt: '2026-07-17T15:03:00',
  },
  {
    id: 'ST0611-0618-014',
    title: '取放物品采集 #14',
    scene: 'kitchen',
    sceneLabel: '厨房-取放物品',
    operator: '陈静',
    deviceSn: 'ZEDM-44012208',
    status: 'processing',
    sliceDone: 10,
    sliceTotal: 10,
    updatedAt: '2026-07-17T14:40:00',
  },
]

export const slices: DataSlice[] = [
  {
    id: 'ST0701-0708-RAW-022',
    taskId: 'ST0701-0708-004',
    stage: 'extrinsic',
    stageLabel: '高精度外参',
    durationSec: 300,
    scene: 'desktop',
    sceneLabel: '桌面-精细操作',
    quality: 'pending',
    storageUri: 's3://edp-bucket/ST0701-0708-RAW-022/',
    updatedAt: '2026-07-17T15:00:00',
  },
  {
    id: 'ST0709-0716-RAW-014',
    taskId: 'ST0709-0716-005',
    stage: 'split',
    stageLabel: '切分',
    durationSec: 300,
    scene: 'shelf',
    sceneLabel: '货架-抓取分拣',
    quality: 'pending',
    storageUri: 's3://edp-bucket/ST0709-0716-RAW-014/',
    updatedAt: '2026-07-17T14:58:00',
  },
  {
    id: 'ST0611-0618-RAW-016',
    taskId: 'ST0611-0618-014',
    stage: 'prelabel',
    stageLabel: '3D 预标',
    durationSec: 300,
    scene: 'kitchen',
    sceneLabel: '厨房-取放物品',
    quality: 'medium',
    storageUri: 's3://edp-bucket/ST0611-0618-RAW-016/',
    updatedAt: '2026-07-17T14:55:00',
  },
  {
    id: 'ST0602-0610-RAW-029',
    taskId: 'ST0611-0618-014',
    stage: 'voicetag',
    stageLabel: '语音 Tag',
    durationSec: 300,
    scene: 'kitchen',
    sceneLabel: '厨房-取放物品',
    quality: 'high',
    storageUri: 's3://edp-bucket/ST0602-0610-RAW-029/',
    updatedAt: '2026-07-17T14:50:00',
  },
]

export const jobs: PipelineJob[] = [
  {
    id: 'job-1001',
    sliceId: 'ST0701-0708-RAW-022',
    operator: 'extrinsic',
    status: 'running',
    progress: 62,
    createdAt: '2026-07-17T14:50:00',
  },
  {
    id: 'job-1002',
    sliceId: 'ST0709-0716-RAW-014',
    operator: 'split',
    status: 'queued',
    progress: 0,
    createdAt: '2026-07-17T15:00:00',
  },
  {
    id: 'job-1003',
    sliceId: 'ST0611-0618-RAW-016',
    operator: 'prelabel',
    status: 'success',
    progress: 100,
    createdAt: '2026-07-17T13:20:00',
    finishedAt: '2026-07-17T13:35:00',
  },
  {
    id: 'job-1004',
    sliceId: 'ST0623-0630-RAW-008',
    operator: 'parse',
    status: 'failed',
    progress: 40,
    error: '双目校正失败：左图缺失帧',
    createdAt: '2026-07-17T12:10:00',
    finishedAt: '2026-07-17T12:18:00',
  },
]

function makeWorkers(): WorkerNode[] {
  const groups: Array<{ role: string; roleLabel: string; count: number }> = [
    { role: 'voicetag', roleLabel: '语音 Tag 解析', count: 4 },
    { role: 'parse', roleLabel: '去畸变/双目校正', count: 8 },
    { role: 'prelabel', roleLabel: '手部 3D 预标', count: 2 },
    { role: 'extrinsic', roleLabel: '高精度外参', count: 4 },
  ]
  const list: WorkerNode[] = []
  for (const g of groups) {
    for (let i = 1; i <= g.count; i++) {
      const busy = g.role === 'extrinsic' && i === 1
      list.push({
        name: `${g.role}-worker-${i}`,
        role: g.role,
        roleLabel: g.roleLabel,
        status: busy ? 'busy' : 'online',
        gpuUtil: busy ? 0.72 : 0,
        memGb: busy ? 6.4 : 0,
        currentJobId: busy ? 'job-1001' : undefined,
        lastHeartbeatAt: '2026-07-17T15:04:43',
      })
    }
  }
  return list
}

export const workers = makeWorkers()

/** 质检列表 —— 对标 https://rkzhegwavgdgc.ok.kimi.link/qc */
const qcSeed: Array<{
  id: string
  dataId: string
  dataStatus: QcDataStatus
  scene: SceneCode
  sceneLabel: string
  tagCount: number
  issueCount: number
  quality: QualityLevel | null
  qcStatus: 'pending' | 'passed' | 'rejected'
}> = [
  { id: 'dr2', dataId: 'ST0611-0618-RAW-002', dataStatus: 'delivered', scene: 'kitchen', sceneLabel: '厨房-取放物品', tagCount: 13, issueCount: 0, quality: 'high', qcStatus: 'pending' },
  { id: 'dr3', dataId: 'ST0623-0630-RAW-003', dataStatus: 'optimized', scene: 'living', sceneLabel: '客厅-整理收纳', tagCount: 14, issueCount: 1, quality: null, qcStatus: 'pending' },
  { id: 'dr4', dataId: 'ST0701-0708-RAW-004', dataStatus: 'prelabeled', scene: 'desktop', sceneLabel: '桌面-精细操作', tagCount: 14, issueCount: 1, quality: null, qcStatus: 'pending' },
  { id: 'dr9', dataId: 'ST0623-0630-RAW-009', dataStatus: 'delivered', scene: 'living', sceneLabel: '客厅-整理收纳', tagCount: 14, issueCount: 0, quality: null, qcStatus: 'pending' },
  { id: 'dr12', dataId: 'ST0717-0724-RAW-012', dataStatus: 'delivered', scene: 'meeting', sceneLabel: '会议室-书写演示', tagCount: 15, issueCount: 1, quality: 'medium', qcStatus: 'pending' },
  { id: 'dr13', dataId: 'ST0602-0610-RAW-013', dataStatus: 'optimized', scene: 'office', sceneLabel: '工位-日常办公', tagCount: 12, issueCount: 0, quality: null, qcStatus: 'pending' },
  { id: 'dr14', dataId: 'ST0611-0618-RAW-014', dataStatus: 'prelabeled', scene: 'kitchen', sceneLabel: '厨房-取放物品', tagCount: 13, issueCount: 0, quality: null, qcStatus: 'pending' },
  { id: 'dr23', dataId: 'ST0709-0716-RAW-023', dataStatus: 'optimized', scene: 'shelf', sceneLabel: '货架-抓取分拣', tagCount: 14, issueCount: 0, quality: null, qcStatus: 'pending' },
  { id: 'dr24', dataId: 'ST0717-0724-RAW-024', dataStatus: 'prelabeled', scene: 'meeting', sceneLabel: '会议室-书写演示', tagCount: 14, issueCount: 1, quality: null, qcStatus: 'pending' },
  { id: 'dr29', dataId: 'ST0709-0716-RAW-029', dataStatus: 'delivered', scene: 'shelf', sceneLabel: '货架-抓取分拣', tagCount: 13, issueCount: 0, quality: 'high', qcStatus: 'pending' },
  { id: 'dr32', dataId: 'ST0611-0618-RAW-032', dataStatus: 'delivered', scene: 'kitchen', sceneLabel: '厨房-取放物品', tagCount: 13, issueCount: 0, quality: 'high', qcStatus: 'pending' },
  { id: 'dr33', dataId: 'ST0623-0630-RAW-033', dataStatus: 'optimized', scene: 'living', sceneLabel: '客厅-整理收纳', tagCount: 13, issueCount: 0, quality: null, qcStatus: 'pending' },
  { id: 'dr34', dataId: 'ST0701-0708-RAW-034', dataStatus: 'prelabeled', scene: 'desktop', sceneLabel: '桌面-精细操作', tagCount: 14, issueCount: 0, quality: null, qcStatus: 'pending' },
  { id: 'dr39', dataId: 'ST0623-0630-RAW-039', dataStatus: 'delivered', scene: 'living', sceneLabel: '客厅-整理收纳', tagCount: 14, issueCount: 0, quality: 'high', qcStatus: 'pending' },
  { id: 'dr42', dataId: 'ST0717-0724-RAW-042', dataStatus: 'delivered', scene: 'meeting', sceneLabel: '会议室-书写演示', tagCount: 15, issueCount: 0, quality: 'medium', qcStatus: 'pending' },
  // 已完成示例（用于「已完成」Tab）
  { id: 'dr101', dataId: 'ST0501-0508-RAW-101', dataStatus: 'delivered', scene: 'kitchen', sceneLabel: '厨房-取放物品', tagCount: 12, issueCount: 0, quality: 'high', qcStatus: 'passed' },
  { id: 'dr102', dataId: 'ST0509-0516-RAW-102', dataStatus: 'delivered', scene: 'desktop', sceneLabel: '桌面-精细操作', tagCount: 11, issueCount: 2, quality: 'medium', qcStatus: 'passed' },
  { id: 'dr103', dataId: 'ST0517-0524-RAW-103', dataStatus: 'delivered', scene: 'shelf', sceneLabel: '货架-抓取分拣', tagCount: 10, issueCount: 3, quality: 'low', qcStatus: 'rejected' },
]

export const qcPackages: QcPackage[] = qcSeed.map((row) => ({
  ...row,
  name: row.dataId,
  version: 'v2.1',
  episodes: 1,
  frames: 9000 + row.tagCount * 100,
  path: `s3://edp-bucket/${row.dataId}/`,
  createdAt: '2026-07-17T10:00:00',
}))

/** 详情页扩展数据（Tag / 问题 / 质量区间）—— 对标 /qc/dr2 */
const defaultTags = [
  '取矿泉水',
  '翻笔记本',
  '贴便利贴',
  '拧紧杯盖',
  '移动鼠标',
  '橡皮擦字',
  '喝水',
  '取出剪刀',
  '打开抽屉',
  '移动鼠标',
  '橡皮擦字',
  '翻笔记本',
  '调整台灯',
]

function buildTags(count: number) {
  const duration = 300
  const span = duration / Math.max(count, 1)
  return Array.from({ length: count }, (_, i) => {
    const start = Math.round(i * span * 10) / 10
    const end = Math.min(duration, Math.round((start + span * 0.85) * 10) / 10)
    return {
      id: `tag-${i + 1}`,
      label: defaultTags[i % defaultTags.length],
      startSec: start,
      endSec: end,
      confidence: i % 3 === 0 ? 0.72 : 0.91,
      edited: i === 2,
    }
  })
}

export const qcDetailExtras: Record<string, import('@/types').QcDetailExtra> = {
  dr2: {
    inspector: '刘洋',
    durationSec: 300,
    fps: 30,
    lockKey: 'lock:qc:ST0611-0618-RAW-002',
    tags: buildTags(13),
    issues: [
      {
        id: 'iss-1',
        code: 'hand_jitter',
        severity: 'medium',
        title: '手部 3D 关节抖动明显，建议人工复核',
        frameStart: 3224,
        frameEnd: 8626,
        author: '赵敏',
        date: '07-12',
        status: 'ignored',
      },
    ],
    qualitySegments: [
      { id: 'qs-1', startSec: 0, endSec: 120, quality: 'high' },
      { id: 'qs-2', startSec: 120, endSec: 180, quality: 'medium' },
      { id: 'qs-3', startSec: 180, endSec: 300, quality: 'high' },
    ],
    manualEdits: 1,
    lowConfidenceCount: 6,
  },
}

export function getOrCreateQcDetailExtra(id: string, pkg: QcPackage): import('@/types').QcDetailExtra {
  if (qcDetailExtras[id]) return qcDetailExtras[id]
  const extra: import('@/types').QcDetailExtra = {
    inspector: '刘洋',
    durationSec: 300,
    fps: 30,
    lockKey: `lock:qc:${pkg.dataId}`,
    tags: buildTags(pkg.tagCount),
    issues:
      pkg.issueCount > 0
        ? [
            {
              id: `iss-${id}`,
              code: 'sync_drift',
              severity: 'medium',
              title: '左右目时间戳轻微漂移',
              frameStart: 100,
              frameEnd: 800,
              author: '系统',
              date: '07-17',
              status: 'open',
            },
          ]
        : [],
    qualitySegments: [{ id: `qs-${id}`, startSec: 0, endSec: 300, quality: 'high' }],
    manualEdits: 0,
    lowConfidenceCount: Math.max(0, Math.floor(pkg.tagCount / 2)),
  }
  qcDetailExtras[id] = extra
  return extra
}

export function toQcSession(extra: import('@/types').QcDetailExtra): import('@/types').QcSession {
  return {
    inspector: extra.inspector,
    durationSec: extra.durationSec,
    fps: extra.fps,
    lockKey: extra.lockKey,
    manualEdits: extra.manualEdits,
    lowConfidenceCount: extra.lowConfidenceCount,
  }
}

export function toQcAnnotations(extra: import('@/types').QcDetailExtra): import('@/types').QcAnnotations {
  return {
    tags: extra.tags,
    issues: extra.issues,
    qualitySegments: extra.qualitySegments,
  }
}

export function saveQcAnnotations(
  id: string,
  pkg: QcPackage,
  payload: import('@/types').QcAnnotationsUpdate,
): import('@/types').QcAnnotations {
  const extra = getOrCreateQcDetailExtra(id, pkg)
  extra.tags = payload.tags
  extra.issues = payload.issues
  extra.qualitySegments = payload.qualitySegments
  extra.manualEdits += 1
  pkg.tagCount = payload.tags.length
  pkg.issueCount = payload.issues.filter((i) => i.status === 'open').length
  return toQcAnnotations(extra)
}
/** 交付列表摘要 —— 由完整 LeRobot Mock 派生，保证与 pen/mouse 元信息一致 */
export const datasets = lerobotDatasets.map(toDeliveryDataset)
