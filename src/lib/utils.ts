import clsx from 'clsx'

export { clsx as cn }

export const stageLabels: Record<string, string> = {
  raw: '原始',
  split: '切分',
  parse: '解析',
  voicetag: '语音 Tag',
  prelabel: '3D 预标',
  extrinsic: '外参',
  postprocess: '后处理',
  lerobot: 'LeRobot 交付',
  qc_pass: '质检通过',
}

export const statusLabel: Record<string, string> = {
  recording: '录制中',
  uploading: '上传中',
  processing: '处理中',
  done: '已完成',
  failed: '失败',
  queued: '排队',
  running: '运行中',
  success: '成功',
  online: '在线',
  busy: '忙碌',
  offline: '离线',
  pending: '待质检',
  passed: '已通过',
  rejected: '已驳回',
  high: '高质量',
  medium: '中质量',
  low: '低质量',
  prelabeled: '已预标',
  optimized: '已优化',
  delivered: '已交付',
}

export function pct(n: number) {
  return `${Math.round(n * 100)}%`
}

export function formatNumber(n: number) {
  return n.toLocaleString('zh-CN')
}
